import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from './task.entity';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.tasksService.create(userId, createTaskDto);
  }

  @Get()
  findAll(@Query('status') status: TaskStatus, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    
    if (status) {
      return this.tasksService.findByStatus(userId, status);
    }
    
    return this.tasksService.findAll(userId);
  }

  @Get('upcoming')
  findUpcoming(@Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.tasksService.findUpcoming(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.tasksService.update(id, userId, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.headers['x-user-id'] || 'default-user';
    return this.tasksService.remove(id, userId);
  }

  @Post('republish')
  async republishAll() {
    return this.tasksService.republishAllTasks();
  }
}
