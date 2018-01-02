#!/usr/bin/env bash


echo Running DMIS Deploy, current branch is $BRANCH

# We don't want to deploy Pull Requests only builds on develop and master
if [ $IS_PULL_REQUEST == true ]
    then
        echo Not Deploying Build $BUILD_NUMBER - Branch is $BRANCH, Is Pull Request is $IS_PULL_REQUEST
        return
fi

# Set Version Number
VERSION=v.0.0.$BUILD_NUMBER-$BRANCH

# Only deploy to Staging if we're on develop
if [ $BRANCH == "develop" ]
    then
        pip install --upgrade pip
        
        # Install AWS requirements
        pip install -r requirements.aws-deploy.txt
        printf 'n\n' | eb init dmis --region eu-west-1
        eb use dmis-staging

        # Deploy develop builds to Staging environment
        echo Deploying $VERSION to dmis-staging
        eb deploy -l $VERSION
fi

# Only deploy to Prod if we're on master and testing the Prod Environment
if [ $BRANCH == "master" ]
    then
        # Write version number into file so it can be displayed on app
        echo $VERSION [ `date` ]  > version.txt

        pip install --upgrade pip

        # Install AWS requirements
        pip install -r requirements.aws-deploy.txt
        printf '1\nn\n' | eb init themapcloud-portal --region eu-west-1
        eb use themapcloudPortal-prod

        # Deploy develop builds to Staging environment
        echo Deploying $VERSION to themapcloudPortal-prod
        eb deploy -l $VERSION

         # Tag Prod version
        git tag -a $VERSION -m "$VERSION deployed to Production"
        git push origin $VERSION
fi
