import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { DisplayViewColumns } from 'src/report/entities/displayview-columns.entity';
import { ReportColumns } from 'src/report/entities/report-columns.entity';
import { generateExcelStream } from 'src/tools/excel/excel.service';
import { PassThrough } from 'stream';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class DatawarehouseService {
  constructor(
    @InjectEntityManager('datawarehouse')
    private readonly entityManager: EntityManager,
    @InjectRepository(ReportColumns)
    private readonly reportColumnsRepository: Repository<ReportColumns>,
    @InjectRepository(DisplayViewColumns)
    private readonly displayviewColumnsRepository: Repository<DisplayViewColumns>,
  ) {}

  convertDateToNumber(date1: Date | string | undefined | null): number | null {
    if (!date1) return null;
    const date = new Date(date1);
    if (isNaN(date.getTime())) {
      console.error('Invalid date passed:', date1);
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`);
  }

  private readonly dropdownCache = new Map<string, { data: string[]; timestamp: number }>();
  private readonly columnCache = new Map<string, { columns: string[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

  async getItemsforDropdown(data: {
    schema: string;
    view: string;
    column: string;
  }) {
    if (!data.view || !data.schema || !data.column) {
      return [];
    }
    const cacheKey = `${data.schema}:${data.view}:${data.column}`;
    const cached = this.dropdownCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const query = `SELECT DISTINCT "${data.column}" as item FROM "${data.schema}"."${data.view}" WHERE "${data.column}" IS NOT NULL LIMIT 200`;
      const output = await this.entityManager.query(query);
      const result = (output && output.length > 0)
        ? output.map((f: any) => String(f.item)).filter(Boolean)
        : [];
      
      this.dropdownCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error fetching dropdown items from datawarehouse:', error?.message);
      return [];
    }
  }

  private async resolveActiveColumns(data: {
    view: string;
    schema: string;
    reportid?: number;
    display_view?: number;
  }): Promise<any[]> {
    const { view, schema, reportid, display_view } = data;
    let activeColumns: any[] = [];

    if (reportid) {
      activeColumns = await this.reportColumnsRepository.find({
        where: { hidden: false, report: { id: reportid } },
        select: ['column', 'displayName', 'filter_type'],
        order: { sort_order: 'asc' },
      });
    }

    if (display_view) {
      const displayviewcolumns = await this.displayviewColumnsRepository.find({
        where: { displayview: { id: display_view } },
      });
      displayviewcolumns.forEach((column: any) => {
        if (column.function === 'hide') {
          activeColumns = activeColumns.filter((f: any) => f.column !== column.column);
        }
      });
    }

    if (activeColumns.length === 0) {
      const colList = await this.getColumnListBySchemaAndView({ view, schema });
      if ('columns' in colList && Array.isArray(colList.columns)) {
        activeColumns = colList.columns.map((c: string) => ({
          column: c,
          displayName: c,
          filter_type: 'text',
        }));
      }
    } else {
      activeColumns = activeColumns.map((c: any) => ({
        ...c,
        displayName: c.displayName && String(c.displayName).trim() ? c.displayName : c.column,
      }));
    }

    return activeColumns;
  }

  private buildQueryAndParams(
    schema: string,
    view: string,
    activeColumns: any[],
    columnfilter: any = {},
    sortField: string = '',
    sortOrder: string = 'asc',
  ): { query: string; countQuery: string; queryParams: any[]; tempcolumns: string[] } {
    const selectedColumns = activeColumns.map((col) => `"${col.column}"`).join(', ');
    const tempcolumns = activeColumns.map((col) => col.column);

    let query = `SELECT ${selectedColumns} FROM "${schema}"."${view}"`;
    let countQuery = `SELECT COUNT(*) as count FROM "${schema}"."${view}"`;
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (columnfilter && typeof columnfilter === 'object') {
      Object.entries(columnfilter).forEach(([key, filterVal]: any) => {
        if (tempcolumns.includes(key) && filterVal) {
          const val = filterVal.value !== undefined ? filterVal.value : filterVal;
          const fType = filterVal.filter_type || '';

          if (fType === 'dropdown' && Array.isArray(val) && val.length > 0) {
            whereConditions.push(`"${key}"::text = ANY($${queryParams.length + 1})`);
            queryParams.push(val);
          } else if (fType === 'number_range' && val) {
            if (val.min !== '' && val.min !== undefined && val.max !== '' && val.max !== undefined) {
              whereConditions.push(`"${key}" BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
              queryParams.push(val.min, val.max);
            } else if (val.min !== '' && val.min !== undefined) {
              whereConditions.push(`"${key}" >= $${queryParams.length + 1}`);
              queryParams.push(val.min);
            } else if (val.max !== '' && val.max !== undefined) {
              whereConditions.push(`"${key}" <= $${queryParams.length + 1}`);
              queryParams.push(val.max);
            }
          } else if (val !== '' && val !== null && val !== undefined) {
            whereConditions.push(`"${key}"::text ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${val}%`);
          }
        }
      });
    }

    if (whereConditions.length > 0) {
      const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    if (sortField && tempcolumns.includes(sortField)) {
      query += ` ORDER BY "${sortField}" ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
    }

    return { query, countQuery, queryParams, tempcolumns };
  }

  async getReportByParameters(data: {
    view: string;
    schema: string;
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder: string;
    filter?: string;
    columnfilter: any;
    download: boolean;
    reportid: number;
    display_view: number;
  }) {
    const {
      view,
      schema,
      page = 1,
      pageSize = 15,
      sortField = '',
      sortOrder = 'asc',
      columnfilter = {},
      download = false,
      reportid,
      display_view,
    } = data;

    try {
      if (!view || !schema) {
        return { data: [], columns: [], totalRecords: 0, rowCount: 0 };
      }

      const activeColumns = await this.resolveActiveColumns({ view, schema, reportid, display_view });
      if (activeColumns.length === 0) {
        return { data: [], columns: [], totalRecords: 0, rowCount: 0 };
      }

      const { query: baseQuery, countQuery, queryParams } = this.buildQueryAndParams(
        schema,
        view,
        activeColumns,
        columnfilter,
        sortField,
        sortOrder,
      );

      if (!download) {
        const pagedQuery = `${baseQuery} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const pagedParams = [...queryParams, pageSize, (page - 1) * pageSize];

        // Execute count and page slice in parallel for maximum speed
        const [countResult, rows] = await Promise.all([
          this.entityManager.query(countQuery, queryParams),
          this.entityManager.query(pagedQuery, pagedParams),
        ]);

        const totalRecords = parseInt(countResult[0]?.count || '0', 10);

        return {
          data: rows,
          columns: activeColumns,
          totalRecords,
          rowCount: totalRecords,
        };
      }

      const rows = await this.entityManager.query(baseQuery, queryParams);

      return {
        data: rows,
        columns: activeColumns,
        totalRecords: rows.length,
        rowCount: rows.length,
      };
    } catch (error) {
      console.error('Datawarehouse query error:', error?.message);
      return {
        data: [],
        columns: [],
        totalRecords: 0,
        rowCount: 0,
      };
    }
  }

  async getColumnListBySchemaAndView(data: { view: string; schema: string }) {
    if (!data.view || !data.schema) {
      return new HttpException('Schema and view parameters are required', 400);
    }
    const cacheKey = `${data.schema}:${data.view}`;
    const cached = this.columnCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (30 * 60 * 1000)) {
      return { columns: cached.columns };
    }

    try {
      const columnQuery = `
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position ASC
      `;
      const rawCols = await this.entityManager.query(columnQuery, [data.schema, data.view]);
      const columns = (rawCols || []).map((row: any) => row.column_name);

      this.columnCache.set(cacheKey, { columns, timestamp: Date.now() });
      return { columns: columns || [] };
    } catch (error) {
      console.error('Error fetching columns from information_schema:', error?.message);
      return { columns: [] };
    }
  }

  async downloadReport(data: any): Promise<PassThrough> {
    const stream = new PassThrough();

    (async () => {
      try {
        const { view, schema, sortField = '', sortOrder = 'asc', columnfilter = {}, reportid, display_view } = data;

        if (!view || !schema) {
          stream.end();
          return;
        }

        const activeColumns = await this.resolveActiveColumns({ view, schema, reportid, display_view });
        if (activeColumns.length === 0) {
          stream.end();
          return;
        }

        const { query: baseQuery, queryParams } = this.buildQueryAndParams(
          schema,
          view,
          activeColumns,
          columnfilter,
          sortField,
          sortOrder,
        );

        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });
        const worksheet = workbook.addWorksheet('Report');

        worksheet.columns = activeColumns.map((col) => ({
          header: col.displayName || col.column,
          key: col.column,
          width: Math.max((col.displayName || col.column).length + 4, 12),
        }));

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        headerRow.commit();

        // Stream from DB in safe batches of 5000 rows
        const CHUNK_SIZE = 5000;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const chunkParams = [...queryParams, CHUNK_SIZE, offset];
          const chunkQuery = `${baseQuery} LIMIT $${chunkParams.length - 1} OFFSET $${chunkParams.length}`;
          const chunkRows = await this.entityManager.query(chunkQuery, chunkParams);

          if (!chunkRows || chunkRows.length === 0) {
            hasMore = false;
            break;
          }

          for (const row of chunkRows) {
            worksheet.addRow(row).commit();
          }

          offset += chunkRows.length;
          if (chunkRows.length < CHUNK_SIZE) {
            hasMore = false;
            break;
          }
        }

        await workbook.commit();
      } catch (err) {
        console.error('Error during chunked excel generation:', err);
        stream.destroy(err);
      }
    })();

    return stream;
  }
}
