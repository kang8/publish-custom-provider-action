const core = require("@actions/core");

const CreateVersion = require("./create_version");
const UploadBinaries = require("./upload_binaries");
const UploadChecksums = require("./upload_checksums");

async function runUpload() {
  try {
    const keyID = core.getInput("key_id");
    const version = core.getInput("version");
    const binaryLocation = core.getInput("binary_location");

    const orgName = "gd-test";
    const providerName = "gd-stripe-provider";

    // create a provider version  on registry

    let checksumResponse = JSON.parse(await CreateVersion(orgName, providerName, version, keyID)); //returns checksum links to upload checksums to

    // upload checksums using links from provider version response

    let shaSumsLinks = {shaSum: checksumResponse['data']['links']['shasum-upload'], shaSumSig: checksumResponse['data']['links']['shasums-sig-upload']};
    await UploadChecksums(binaryLocation, shaSumsLinks);
    
    //create all providers for the version created above, as per the artifacts in the provided directory

    await UploadBinaries(orgName, providerName, version, binaryLocation);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

runUpload();
