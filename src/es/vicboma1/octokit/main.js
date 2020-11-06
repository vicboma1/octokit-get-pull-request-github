const { Octokit } = require("@octokit/rest");

const ORGANIZATION = 'GeeksHubsAcademy'
const REPOSITORY = 'hello-world'
const BRANCH_MASTER = 'master'
const MAX_SIZE_PAGE = 100
const PAGED_BRANCH = 1
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

/**
 * Recupera la información de la ultima PR
 * @param {*} container 
 * @param {*} currentLastcommit 
 */
const getListPullRequestsAssociatedWithCommit = async (container, currentLastcommit)  =>
      container.octokit.repos.listPullRequestsAssociatedWithCommit({
            owner: container.org,
            repo: container.repo,
            commit_sha: currentLastcommit.latestCommitSha
      })
      .then( pr  => {
            console.log('listPullRequestsAssociatedWithCommit:\n ', pr.data[0]);
            return pr.data[0];
     })
     .catch( ex =>
            console.log('Error:'+ex) );

/**
 * Existe el repo en todo el repositorio
 * @param {*} container 
 * @param {*} maxSizePage 
 */
const validateRepoPaged = async (container, maxSizePage) => {
      var isEnd = false;
      for(var i = 1; !isEnd; i++){
            const repos = await container.octokit.repos.listForOrg({
                  org: container.org,
                  per_page: maxSizePage,
                  page:  i }
            );


            if( repos.data.length  == 0){
                  const err = 'Error: El repositorio no existe';
                  console.log(err)
                  alert(err);
                  return false;
            }

            if(validateRepo(repos, container.repo))
                   return true;
      }
}

/**
 * Valida que el repo actual existe.
 * @param {*} repos 
 */
const validateRepo = (repos, repo) => 
       repos.data.map(repo => repo.name).includes(repo);

/**
 * Moficida el contenido del fichero con nuestro cambio
 * @param {*} file 
 * @param {*} input 
 */
const setChanges = (file, changesTxt, regex) => {
      const paramReplace = file.match(regex);
      const res = file.replace(paramReplace, "'"+changesTxt+"'");
      console.log('setChanges: ',res);
      return res;
};

/**
  * Recupera el fichero que queremos modificar  
  * @param {*} octokit 
  * @param {*} org 
  * @param {*} repo 
  * @param {*} file 
  */
const getFile = async (container, file ) => 
      container.octokit.repos.getContent({
            owner: container.org,
            repo: container.repo,
            path: file
      })
      .then( it => {
             var res = Buffer.from(it.data.content, 'base64').toString()
             console.log('getFile: ',res);
             return res;
      })
      .catch( ex => console.log('Error:'+ex) );

/**
 * Realiza la busqueda del ultimo commit actual
 * @param {*} octokit 
 * @param {*} org 
 * @param {*} repo 
 * @param {*} _sha 
 * @param {*} index 
 */
const getCurrentLastCommit = async (container, _sha, index) => 
    container.octokit.repos.listCommits({
      owner: container.org,
      repo: container.repo,
      sha: _sha,
      per_page: index,
    }).then( it => {
            const res = it.data[0];
            console.log('latestCommitSha: '+res.sha+"\ntreeSha: "+res.commit.tree.sha);
            return {
                  latestCommitSha: res.sha,
                  treeSha: res.commit.tree.sha,
            }
    })
    .catch( ex => console.log('Error:'+ex) );    


/**
 * Crea un nuevo arbol con los cambios 
 * @param {*} octokit 
 * @param {*} org 
 * @param {*} repo 
 * @param {*} treeSha 
 * @param {*} mode 
 * @param {*} type 
 * @param {*} listParam 
 * @param {*} index 
 */
const getCreateNewTree = async(container, treeSha, mode, type, changes) => 
      container.octokit.git.createTree({
            owner: container.org,
            repo: container.repo,
            base_tree: treeSha,
            tree: Object.keys(changes.files).map(path => factoryTree(path, changes, mode, type) ),
      }).then(it => {
            const newTree = factoryTreeResult(it, changes);
            console.log('Tree result : ', newTree);
            return newTree;
      })
      .catch( ex => console.log('Error:',ex) );    

/**
 * Factoria para declarar la estructura del arbol
 * @param {*} path 
 * @param {*} data 
 * @param {*} mode 
 * @param {*} type 
 */
const factoryTree = (path, data, mode, type)  => {
      return  { path: path, mode: mode, content: data.files[path], type: type, }
};

/**
 * Factoria para declarar el resultado del arbol
 * @param {*} response 
 * @param {*} data 
 */
const factoryTreeResult = (response, data) => {
      return { newTreeSha: response.data.sha, content: data, };
};

/**
 * Factoria para declarar los cambios
 * @param {*} input 
 */
const factoryChanges = ( newFile, repo ) => {
      const decrypt = Buffer.from(repo, 'base64').toString().replace(/\n|\r/g, "")
      return {
            files: { '.travis.yml': newFile },
            commit: 'Ejecución del Oráculo ['+ decrypt +'] => ['+getYYYYMMDDHHMMSS()+']'};
      };
      
/**
 * Crea el commit con los cambios
 * @param {*} octokit 
 * @param {*} org 
 * @param {*} repo 
 * @param {*} newTreeSha 
 * @param {*} latestCommitSha 
 * @param {*} listParams 
 * @param {*} index 
 */
const createCommit = async (container, newTreeResut, latestCommitSha) => 
      container.octokit.git.createCommit({
        owner: container.org,
        repo: container.repo,
        message: newTreeResut.content.commit,
        tree: newTreeResut.newTreeSha,
        parents: [latestCommitSha]
      }).then(it => {
            var commitSha = it.data.sha;
            console.log("createCommitSha: ", commitSha);
            return commitSha;
      })
      .catch( ex => console.log('Error:',ex) );    

/**
 * Actualiza el ref del commit
 * @param {*} octokit 
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} latestCommitSha 
 * @param {*} ref 
 * @param {*} force 
 */
const updateRef = async (container,latestCommitSha,ref,force) =>
      container.octokit.git.updateRef({
            owner: container.org,
            repo: container.repo,
            sha: latestCommitSha,
            ref: ref,
            force: force
      }).then( it => {
            console.log('updateRef: ',it);
            return it;
      })
      .catch( ex => 
            console.log('Error:',ex.request)
             );    
         
/**
 * Crea un nuevo ref para el commit
 * @param {*} octokit 
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} latestCommitSha 
 * @param {*} ref 
 * @param {*} force 
 */
const createNewRef = async (container, latestCommitSha, ref) => 
      container.octokit.git.createRef({
            owner: container.owner,
            repo: container.repo,
            sha: latestCommitSha,
            ref: ref,
      }).then( it => {
            console.log('createRef: ',it);
            return it;
      })
      .catch(ex => {
            console.log(ex);
      });

/**
 * Factory Object Value Pattern
 * @param {*} octo 
 * @param {*} org 
 * @param {*} repo 
 */
const factoryObjectValue = (octo, org, repo ) =>  {
      return {octokit: octo, org: org, repo: repo}; 
};

/**
 * Devuelve la fecha con patron 'YYYYMMDDHHMMSS'
 */
const getYYYYMMDDHHMMSS = () => {
      function pad(n) {  return (n < 10 ? '0' : '') + n; }
      var date = new Date();
      var yyyy = date.getFullYear().toString();
      var MM = pad(date.getMonth() + 1);
      var dd = pad(date.getDate());
      var hh = pad(date.getHours());
      var mm = pad(date.getMinutes())
      var ss = pad(date.getSeconds())

      return yyyy +'-'+ MM +'-'+ dd +'-'+ hh +':'+ mm +':'+ ss;
 };

     
main(REPOSITORY, ORGANIZATION);



