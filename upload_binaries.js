const { fetch, Headers, FormData } = require("node-fetch");
var fs = require("fs");

let UploadBinaries = function(binaryLocation) {
  //get list of filenames in directory
  GetFiles(binaryLocation, (allFiles) => {
    //loop over list:
    allFiles.forEach((file) => {
      //get metadata for file
      let meta = GetMetaData(file);
      //create platform for each file
      let filepath = binaryLocation + "/" + file; //build filepath
      //read in file, create the request, and shoot it off.
      fs.readFile(filepath, async (err, data) => {
        await CreatePlatform(
          meta.os,
          meta.arch,
          meta.filename,
          meta.version,
          meta.provider_name,
          data
        )
      });
    });
  });
};
//helper method to look through the files in the binary location fed in from goreleaser (into gh actions)
let GetFiles = async function(binaryLocation, callback) {
  var fileList = [];
  fs.readdir(binaryLocation, (err, files) => {
    //console.log(files);
    files.forEach((file) => {
      if (file.includes(".zip")) {
        fileList.push(file.toString());
      }
    });
    callback(fileList);
  });
};

//pulls data from filename (if there is a better way than parsing a string, I am ALL EARS!)
let GetMetaData = function(file) {
  //create array of required inputs for platform creation
  let props = file.match("(.+)(?:_)(.+)(?:_)(.+)(?:_)(.+)(?:.zip)");

  //place array values into an object. I could just return the array, but this makes it nicer to use and read
  let metaData = {
    filename: props[0],
    provider_name: props[1],
    version: props[2],
    os: props[3],
    arch: props[4],
  };

  return metaData;
};

// 'Where the magic happens', creating the 'platform' which we will be loading the corresponding binary to
let CreatePlatform = async function(os, arch, filename, version, orgName, providerName, file) {
  var platformHeaders = new Headers();
  platformHeaders.append("Content-Type", "application/vnd.api+json");
  platformHeaders.append(
    "Authorization",
    process.env.TF_CLOUD_BEARER_TOKEN
  );

  var raw = JSON.stringify({
    data: {
      type: "registry-provider-version-platforms",
      attributes: {
        os: `${os}`,
        arch: `${arch}`,
        shasum:
          "7b5841692bd38e1a66b6b47aa1bacb8b2f881d0b57e797f2241b768c186322b3",
        filename: `${filename}`,
      },
    },
  });

  var requestOptions = {
    method: "POST",
    headers: platformHeaders,
    body: raw,
    redirect: "follow",
  };

  return new Promise(
    fetch(`https://app.terraform.io/api/v2/organizations/${orgName}/registry-providers/private/${orgName}/${providerName}/versions/${version}/platforms`, requestOptions)
      //grab the url from the response, use it to upload the file
      .then((response) => UploadFile(file, JSON.parse(response)["data"]["links"]["provider-binary-upload"]))
      .catch((error) => console.log("error", error))
  );
}

// Finally uploading the sacred binary file, as long as all is well you should now be able to consume the released binary
let UploadFile = async function(file, url) {
  let formData = new FormData();
  formData.append(file);

  return new Promise(
    fetch(
      url,
      {
        method: "POST",
        body: formData
      }
    )
      .catch((error) => console.log("error", error))
  );
}

module.exports(UploadBinaries);
