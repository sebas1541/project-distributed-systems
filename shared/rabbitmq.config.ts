export interface RabbitMQConfig {
  url: string;
  exchanges: {
    tasks: string;
    users: string;
    notifications: string;
  };
  queues: {
    taskCreated: string;
    taskUpdated: string;
    taskDeleted: string;
    userRegistered: string;
  };
}

export const rabbitMQConfig: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://smartplanner:rabbitmq_password@rabbitmq:5672',
  exchanges: {
    tasks: 'tasks.exchange',
    users: 'users.exchange',
    notifications: 'notifications.exchange',
  },
  queues: {
    taskCreated: 'tasks.created',
    taskUpdated: 'tasks.updated',
    taskDeleted: 'tasks.deleted',
    userRegistered: 'users.registered',
  },
};
