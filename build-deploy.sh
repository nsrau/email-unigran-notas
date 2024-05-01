#!/bin/bash

# Set the name of the .tar file
tar_file_name="build.tar"

# List of files to be included in the .tar file
files=(index.js package.json package-lock.json captain-definition Dockerfile)

# Remove the existing .tar file if it exists
rm -f $tar_file_name

# Create the .tar file
tar -cvf $tar_file_name "${files[@]}"