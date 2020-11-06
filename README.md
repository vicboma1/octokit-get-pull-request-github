# octokit-get-content-file-github

Install
```
octokit       https://github.com/octokit/rest.js/
vscode-icons  https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons
```

Dependencies
```
npm install @octokit/rest
```

Command line
```
Run file     
    - npx node ./src/vicboma1/octokit/main.js
    - node.exe ./src/es/vicboma1/octokit/main.js
```

Example 
```js
/**
 * Entry Point
 * @param {*} repo 
 * @param {*} org 
 */
const main = async (repo, org) => {
      const octokit = new Octokit({  });
      const container = factoryObjectValue(octokit,org,repo);

      if(!await validateRepoPaged(container, MAX_SIZE_PAGE))
            return;

      const currentLastcommit = await getCurrentLastCommit(container, BRANCH_MASTER, PAGED_BRANCH);
      const lastPR = await getListPullRequestsAssociatedWithCommit(container, currentLastcommit);
};
```

Result lastPR 

![](https://github.com/vicboma1/octokit-get-pull-request-github/blob/main/resources/debug.png)


