import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
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

  async getItemsforDropdown(data: {
    schema: string;
    view: string;
    column: string;
  }) {
    if (!data.view || !data.schema || !data.column) {
      return [];
    }
    try {
      const query = `SELECT DISTINCT "${data.column}" as item FROM "${data.schema}"."${data.view}" WHERE "${data.column}" IS NOT NULL LIMIT 200`;
      const output = await this.entityManager.query(query);
      if (output && output.length > 0) {
        return output.map((f: any) => String(f.item)).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching dropdown items from datawarehouse:', error?.message);
      return [];
    }
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
      filter = '',
      columnfilter = {},
      download = false,
      reportid,
      display_view,
    } = data;

    try {
      if (!view || !schema) {
        return { data: [], columns: [], totalRecords: 0, rowCount: 0 };
      }

      // Fetch active columns for report
      let activeColumns: any[] = [];
      if (reportid) {
        activeColumns = await this.reportColumnsRepository.find({
          where: { hidden: false, report: { id: reportid } },
          select: ['column', 'displayName', 'filter_type'],
          order: { sort_order: 'asc' },
        });
      }

      let displayviewcolumns: any[] = [];
      if (display_view) {
        displayviewcolumns = await this.displayviewColumnsRepository.find({
          where: { displayview: { id: display_view } },
        });
        displayviewcolumns.forEach((column: any) => {
          if (column.function === 'hide') {
            activeColumns = activeColumns.filter((f: any) => f.column !== column.column);
          }
        });
      }

      if (activeColumns.length === 0) {
        // If columns are not yet configured in metadata, query from view schema
        const colList = await this.getColumnListBySchemaAndView({ view, schema });
        if ('columns' in colList && Array.isArray(colList.columns)) {
          activeColumns = colList.columns.map((c: string) => ({
            column: c,
            displayName: c,
            filter_type: 'text',
          }));
        }
      }

      if (activeColumns.length === 0) {
        return { data: [], columns: [], totalRecords: 0, rowCount: 0 };
      }

      const selectedColumns = activeColumns.map((col) => `"${col.column}"`).join(', ');
      const tempcolumns = activeColumns.map((col) => col.column);

      let query = `SELECT ${selectedColumns} FROM "${schema}"."${view}"`;
      let whereConditions: string[] = [];
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
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      if (sortField && tempcolumns.includes(sortField)) {
        query += ` ORDER BY "${sortField}" ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
      }

      let totalRecords = 0;
      if (!download) {
        const countQuery = `SELECT COUNT(*) as count FROM (${query}) as total_count`;
        const countResult = await this.entityManager.query(countQuery, queryParams);
        totalRecords = parseInt(countResult[0]?.count || '0', 10);

        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, (page - 1) * pageSize);
      } else {
        query += ` LIMIT 50000`;
      }

      const rows = await this.entityManager.query(query, queryParams);
      if (download) {
        totalRecords = rows.length;
      }

      return {
        data: rows,
        columns: activeColumns,
        totalRecords,
        rowCount: totalRecords,
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
    try {
      const columnQuery = `
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position ASC
      `;
      const columns = (
        await this.entityManager.query(columnQuery, [data.schema, data.view])
      ).map((row: any) => row.column_name);

      return { columns: columns || [] };
    } catch (error) {
      console.error('Error fetching columns from information_schema:', error?.message);
      return { columns: [] };
    }
  }

  async downloadReport(data: any): Promise<PassThrough> {
    const reportResult = await this.getReportByParameters({ ...data, download: true });
    const tempcolumns = (reportResult.columns || []).map((c: any) => c.column);
    return generateExcelStream(tempcolumns, reportResult.data, reportResult.columns);
  }
}
