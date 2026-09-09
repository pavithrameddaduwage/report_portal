import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { Report } from 'src/report/entities/report.entity';
import { DisplayView } from 'src/report/entities/displayview.entity';
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
    ) {}

    private async syncSequence(tableName: string = 'workspace', idColumn: string = 'id') {
        try {
            await this.workspaceRepository.query(
                `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${idColumn}'), COALESCE((SELECT MAX("${idColumn}") FROM "${tableName}"), 0) + 1, false);`
            ).catch(async () => {
                await this.workspaceRepository.query(
                    `SELECT setval('${tableName}_${idColumn}_seq', COALESCE((SELECT MAX("${idColumn}") FROM "${tableName}"), 0) + 1, false);`
                ).catch(() => {});
            });
        } catch (e) {
            // Ignore if non-postgres or non-sequence column
        }
    }

    async onModuleInit() {
        const tables = ['workspace', 'report', 'display_view', 'role_master', 'users', 'user_roles', 'role_access', 'report_schedule', 'report_schedule_log'];
        for (const table of tables) {
            await this.syncSequence(table).catch(() => {});
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
        return this.workspaceRepository.find({ relations: ['reports', 'reports.display_view_names', 'reports.users', 'users'] });
    }

    findWorkspaceById(id: any) {
        return this.workspaceRepository.findOne({ where: { id: id }, relations: ['reports', 'users'] });
    }

    async createWorkspace(workspace: any) {
        if (!workspace.id || workspace.id == 0) {
            delete workspace.id;
        }

        if (!workspace.id) {
            await this.syncSequence('workspace', 'id');
        }
        
        let createdWorkspace;
        try {
            createdWorkspace = await this.workspaceRepository.save(workspace);
        } catch (err) {
            if (err?.message?.includes('duplicate key') || err?.code === '23505') {
                this.logger.warn(`Duplicate key encountered on workspace save. Syncing sequence and retrying...`);
                await this.syncSequence('workspace', 'id');
                createdWorkspace = await this.workspaceRepository.save(workspace);
            } else {
                throw err;
            }
        }
        return createdWorkspace;
    }

    deleteWorkspace(workspaceid: any) {
        return this.workspaceRepository.delete({ id: workspaceid });
    }

    async assignUsers(id: number, userIds: number[]) {
        const workspace = await this.workspaceRepository.findOne({ where: { id }, relations: ['users'] });
        if (!workspace) throw new Error('Workspace not found');

        const nextUserIds = [...new Set((userIds || []).map(Number).filter((userId) => Number.isInteger(userId) && userId > 0))];
        const currentUserIds = (workspace.users || []).map(({ id }) => id);
        const addUserIds = nextUserIds.filter((userId) => !currentUserIds.includes(userId));
        const removeUserIds = currentUserIds.filter((userId) => !nextUserIds.includes(userId));

        await this.workspaceRepository
            .createQueryBuilder()
            .relation(Workspace, 'users')
            .of(id)
            .addAndRemove(addUserIds, removeUserIds);
        return { success: true, message: `Assigned ${userIds.length} users to workspace.` };
    }
}


