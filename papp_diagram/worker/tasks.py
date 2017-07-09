

from celery.signals import worker_process_init

from proj.CeleryApp import app


@app.task
def add(x, y):
    raise NotImplementedError("sdfsd")
    return x + y


@app.task
def mul(x, y):
    return x * y


@app.task
def xsum(numbers):
    return sum(numbers)


