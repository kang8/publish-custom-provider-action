const fetch = require("node-fetch");
const Headers = require("node-fetch");

let CreateVersion = async function(orgName, providerName, version, keyID) {

  let versionURL = `https://app.terraform.io/api/v2/organizations/${orgName}/registry-providers/private/${orgName}/${providerName}/versions`;

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/vnd.api+json");
  myHeaders.append(
    "Authorization",
    process.env.TF_CLOUD_BEARER_TOKEN
  );

  var raw = JSON.stringify({
    data: {
      type: "registry-provider-versions",
      attributes: {
        version: `${version}`,
        "key-id": `${keyID}`,
        protocols: ["5.0"],
      },
    },
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  return new Promise(fetch(versionURL, requestOptions)
    .then((response) => response.json())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error)));
}

module.exports(CreateVersion);
