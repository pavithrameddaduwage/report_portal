import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Log } from './entities/log.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private logRepository:Repository<Log>
  ){}
  create(createLogDto: any) {
    const newlog=new Log()
    // newlog.user={id:createLogDto.user.userid} as User
    newlog.log_type=createLogDto.log_type
    newlog.description=createLogDto.description
    newlog.old_value=createLogDto.old_value
    newlog.new_value=createLogDto.new_value

    return this.logRepository.save(newlog)
  }

  findAll() {
    return `This action returns all log`;
  }


}
