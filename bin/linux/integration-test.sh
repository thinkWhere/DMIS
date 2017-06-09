#!/usr/bin/env bash

echo "Check if integration tests need to run"

# We don't want to run integration tests on PRs only on deploys
if [ $IS_PULL_REQUEST == true ]
    then
        echo Not running integration tests as is Pull Request
        return
fi

if [ $BRANCH == "develop" ]
    then
        export DMIS_ENV="staging"
        echo Running integration tests in Develop branch against environment $DMIS_ENV
        nosetests ./tests/server/integration --with-xunit --xunit-file ./shippable/testresults/integrationresults.xml
        xvfb-run --server-args="-ac" behave tests/behave --junit --junit-directory ./shippable/testresults/shippable
fi

if [ $BRANCH == "master" ]
    then
        export DMIS_ENV="prod"
        echo Running integration tests in Master branch against environment $DMIS_ENV
        nosetests ./tests/server/integration --with-xunit --xunit-file ./shippable/testresults/integrationresults.xml
        xvfb-run --server-args="-ac" behave tests/behave --junit --junit-directory ./shippable/testresults/shippable
fi
