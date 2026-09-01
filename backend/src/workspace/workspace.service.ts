import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { Report } from 'src/report/entities/report.entity';
import { DisplayView } from 'src/report/entities/displayview.entity';
import { RoleMaster } from 'src/users/entities/role_master.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class WorkspaceService implements OnModuleInit {
    private readonly logger = new Logger(WorkspaceService.name);

    constructor(
        @InjectRepository(Workspace)
        private readonly workspaceRepository: Repository<Workspace>,
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        @InjectRepository(DisplayView)
        private readonly displayViewRepository: Repository<DisplayView>,
        @InjectRepository(RoleMaster)
        private readonly roleRepository: Repository<RoleMaster>,
    ) {}

    async onModuleInit() {
        try {
            await this.cleanupDummyData();
        } catch (e) {
            this.logger.warn(`Dummy cleanup notice: ${e?.message}`);
        }
    }

    async cleanupDummyData() {
        const dummyWsNames = [
            'Demo Workspace',
            'Sales & Revenue Operations',
            'Supply Chain & Inventory',
            'Executive & Financial Analytics',
        ];

        try {
            const dummyWs = await this.workspaceRepository
                .createQueryBuilder('w')
                .where('w.name IN (:...names)', { names: dummyWsNames })
                .orWhere('LOWER(w.name) LIKE :demo', { demo: '%demo%' })
                .getMany();
            const wsIds = dummyWs.map((w) => w.id);


            const dummyReports = await this.reportRepository.find({
                where: [
                    ...(wsIds.length > 0 ? [{ workspace: { id: In(wsIds) } }] : []),
                    { report_name: 'Demo User Report' },
                ],
                relations: ['display_view_names'],
            });
            const rptIds = dummyReports.map((r) => r.id);
            const dvIds = dummyReports.flatMap((r) => (r.display_view_names || []).map((dv) => dv.id));

            if (dvIds.length > 0) {
                await this.workspaceRepository.query(`DELETE FROM user_displayviews_display_view WHERE "displayViewId" IN (${dvIds.join(',')})`).catch(() => {});
                await this.workspaceRepository.query(`DELETE FROM display_view_columns WHERE "displayviewId" IN (${dvIds.join(',')})`).catch(() => {});
                await this.workspaceRepository.query(`DELETE FROM display_view WHERE id IN (${dvIds.join(',')})`).catch(() => {});
            }

            if (rptIds.length > 0) {
                await this.workspaceRepository.query(`DELETE FROM user_reports_report WHERE "reportId" IN (${rptIds.join(',')})`).catch(() => {});
                await this.workspaceRepository.query(`DELETE FROM report_columns WHERE "reportId" IN (${rptIds.join(',')})`).catch(() => {});
                await this.workspaceRepository.query(`DELETE FROM report WHERE id IN (${rptIds.join(',')})`).catch(() => {});
            }

            if (wsIds.length > 0) {
                await this.workspaceRepository.query(`DELETE FROM user_workspaces_workspace WHERE "workspaceId" IN (${wsIds.join(',')})`).catch(() => {});
                await this.workspaceRepository.query(`DELETE FROM workspace WHERE id IN (${wsIds.join(',')})`).catch(() => {});
            }

            await this.workspaceRepository.query(`TRUNCATE TABLE report_schedule_log CASCADE`).catch(() => {});
            await this.workspaceRepository.query(`DELETE FROM report_schedule`).catch(() => {});



            this.logger.log('All dummy workspaces, reports, display views, schedules, and logs cleaned up successfully.');

        } catch (err) {
            this.logger.warn(`Cleanup notice: ${err?.message}`);
        }

        return { message: 'All dummy data removed successfully.' };
    }


    async findAllWorkspaces() {
        return this.workspaceRepository.find({ relations: ['reports'] });
    }

    findWorkspaceById(id: any) {
        return this.workspaceRepository.findOne({ where: { id: id }, relations: ['reports'] });
    }

    async createWorkspace(workspace: any) {
        if (!workspace.id || workspace.id == 0) {
            delete workspace.id;
        }
        
        const createdWorkspace = await this.workspaceRepository.save(workspace);
        
        try {
            // Automatically add a role for this workspace if it doesn't exist
            if (createdWorkspace && createdWorkspace.name) {
                const roleName = `${createdWorkspace.name} WSMember`;
                const existingRole = await this.roleRepository.findOne({ where: { role: roleName }});
                if (!existingRole) {
                    const newRole = new RoleMaster();
                    newRole.role = roleName;
                    newRole.permissions = JSON.stringify(['filter_sort']);
                    await this.roleRepository.save(newRole);
                    this.logger.log(`Auto-created role: ${roleName} for workspace ${createdWorkspace.name}`);
                }
            }
        } catch (e) {
            this.logger.error(`Error auto-creating role for workspace: ${e?.message}`);
        }
        
        return createdWorkspace;
    }

    deleteWorkspace(workspaceid: any) {
        return this.workspaceRepository.delete({ id: workspaceid });
    }
}


