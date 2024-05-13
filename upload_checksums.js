const { fetch, FormData } = require("node-fetch");
var fs = require("fs");

let UploadChecksums = function(binaryLocation, shaSumsLinks) {
  //grab all files with SHA256SUMS in the name (should be limited to only 2 files produced by goreleaser), not sure if there is a better way to filter these
  GetFiles(binaryLocation, "SHA256SUMS", (allFiles) => {
    //loop over list of files found:
    allFiles.forEach((file) => {
      //take each file we have found and upload them to the corresponding url provided from tf cloud!
      let filepath = binaryLocation + "/" + file;
      //if the current file in list is the .sig file, upload to .sig url
      if (file.includes(".sig")) {
        fs.readFile(filepath, async (err, data) => {
          await UploadFile(data, shaSumsLinks.shaSumSig);
        });
      }
      //if the current file in list is not the .sig file, the only other one should be the checksum file. So upload to the checksum link 
      else {
        fs.readFile(filepath, async (err, data) => {
          await UploadFile(data, shaSumsLinks.shaSum);
        });
      }
    });
  });

  //this is duplicate code, but with an extra parameter from the upload binaries script. Should extract at some point and put into one reusable helper method.
  let GetFiles = async function(binaryLocation, lookup, callback) {
    var fileList = [];
    fs.readdir(binaryLocation, (err, files) => {
      files.forEach((file) => {
        if (file.includes(lookup)) {
          fileList.push(file.toString());
        }
      });
      callback(fileList);
    });
  };

  let UploadFile = async function(file, url) {
    let formData = new FormData();
    formData.append(file);

    return new Promise(
      fetch(url, {
        method: "POST",
        body: formData,
      }).catch((error) => console.log("error", error))
    );
  };
};
module.exports(UploadChecksums);
