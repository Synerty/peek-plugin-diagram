

import logging

from celery import Celery

app = Celery('proj',
             broker='amqp://',
             backend='redis://localhost',
             # DbConnection MUST BE FIRST, so that it creates a new connection
             include=['proj.DbConnectionInit', 'proj.tasks',
                      'proj.DispQueueIndexerTask', 'proj.GridKeyQueueCompilerTask'])

# Optional configuration, see the application user guide.
app.conf.update(
    CELERY_TASK_RESULT_EXPIRES=3600,
    CELERY_TASK_SERIALIZER='json',
    CELERY_ACCEPT_CONTENT=['json'],  # Ignore other content
    CELERY_RESULT_SERIALIZER='json',
    CELERY_ENABLE_UTC=True,
)

if __name__ == '__main__':
    app.start()
