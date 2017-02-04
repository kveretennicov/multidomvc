# Spin up todomvc app at localhost:8000, ready for e2e tests.
# Build with "docker build -t todomvc/spam .", then run with
# "docker run -it -p 8000:8000 todomvc/spam".

FROM python:3-onbuild

WORKDIR backend/todomvc
RUN rm -f ./db.sqlite3 && \
    python ./manage.py makemigrations && \
    python ./manage.py migrate && \
    python ./manage.py loaddata initial_data && \
    python ./manage.py createinitialrevisions

EXPOSE 8000
ENTRYPOINT ["python"]
CMD ["./manage.py", "runserver", "0.0.0.0:8000"]
