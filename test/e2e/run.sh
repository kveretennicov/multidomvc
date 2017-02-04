#!/bin/sh

# See https://github.com/jciolek/docker-protractor-headless
docker run -it --privileged --rm --net=host -v /dev/shm:/dev/shm -v $(pwd):/protractor webnicer/protractor-headless $@
