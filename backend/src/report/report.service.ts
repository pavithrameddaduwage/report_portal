import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { ReportColumns } from './entities/report-columns.entity';
import { DisplayView } from './entities/displayview.entity';
import { DisplayViewColumns } from './entities/displayview-columns.entity';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Report)
        private readonly reportRepository:Repository<Report>,
        @InjectRepository(DisplayView)
        private readonly displayviewRepository:Repository<DisplayView>
    ){}

    findAllReports(){
        return this.reportRepository.find({relations:['workspace','columns','display_view_names']})
    }

    findReportsByWorkspaceId(workspaceid:number){
        return this.reportRepository.find({where:{workspace:{id:workspaceid}},relations:['columns']})
    }

    createReport(data:any){
        const report=new Report()
        report.report_name=data.report_name
        report.report_view=data.report_view
        report.database_schema=data.database_schema
        report.id=data.id
        report.workspace={id:data.workspaceId}as Workspace
        report.columns=data.columns as ReportColumns[]
        if (!report.id || report.id==null ||report.id==0){
            delete report.id
        }
    return this.reportRepository.save(report)
    }

   async deleteReport(id:number){
        const report = await this.reportRepository.findOne({
            where: { id: id },
            relations: ['users'],
          })
        
          if (!report) {
            throw new NotFoundException('Report not found')
          }
        
          // Step 1: Remove relations (from join table)
          report.users = []
          await this.reportRepository.save(report)
        
          // Step 2: Delete the report itself
          await this.reportRepository.remove(report)
        // return this.reportRepository.delete({id:id})
    }

  async createDisplayView(displayviewDto:any){
            // 1) If it has an ID, load the existing row + columns; else start fresh
            const dv = (displayviewDto.id && displayviewDto.id!==0)
              ? await this.displayviewRepository.findOne({
                  where: { id: displayviewDto.id },
                })
              : this.displayviewRepository.create();
          
            // 2) Overwrite top‑level fields
            dv.displayview_name = displayviewDto.displayview_name;
            dv.report = { id: displayviewDto.report_id } as Report;
          
            // 3) Map the incoming filters/columns to entity instances
            dv.displayview_columns = (displayviewDto.filters as any[]).map((f) => {
              const col = new DisplayViewColumns();
             if (f.id) col.id = f.id;
              col.column = f.column;
              col.function=f.function
              col.parameter=f.parameter
              
            //   col.displayview = dv;
              return col;
            });
          
            // 4) Save — inserts new columns, updates modified ones, and deletes any missing
            try {
                return await this.displayviewRepository.save(dv);
              } catch (err) {
                // TypeORM throws QueryFailedError for SQL errors
              
                if (
                  // Postgres unique‐violation code is 23505
                  (err as any).code === '23505'
                ) {
                  throw new ConflictException(
                    `A display view named "${dv.displayview_name}" already exists.`,
                  );
                }
                // re‑throw anything else
                throw err;
              }
          
          
    }

  findAllDisplayViews(){
    return this.displayviewRepository.find({relations:['report','report.workspace']})
  }

  findDisplayViewByReportId(reportId:number){
    return this.displayviewRepository.find({where:{report:{id:reportId}}})
  }

  async deleteDisplayView(id: number) {
    const dv = await this.displayviewRepository.findOne({
      where: { id: id },
      relations: ['users', 'displayview_columns'],
    });

    if (!dv) {
      throw new NotFoundException('Display view not found');
    }

    dv.users = [];
    await this.displayviewRepository.save(dv);
    return this.displayviewRepository.remove(dv);
  }
}

