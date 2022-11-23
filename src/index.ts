import path from 'path';
import fs from 'fs-extra';

const cwd = process.cwd();

const getWorkSpaceTargets = (workspace: string) => {
  const targetDir = path.join(cwd, workspace);
  const isExist = fs.existsSync(targetDir);
  if(isExist){
    const targetPackages = fs.readdirSync(targetDir);
    const targetPackagesPath = targetPackages.map(((item) => path.join(targetDir, item)));
    return targetPackagesPath.filter((dir) => {
      if(!fs.statSync(dir).isDirectory()){
        return false;
      }
      const targetPackagePath = `${dir}/package.json`;
      const isExist = fs.existsSync(targetPackagePath);
      if(isExist){
        const pkg = require(targetPackagePath);
        return pkg.private ? false : true;
      }
      return false;
    });
  }else{
    return [];
  }
};

const run = () => {
  const conf = require(path.join(cwd, './build.conf.json'));
  let target;
  if(conf.workspaces && Array.isArray(conf.workspaces)){
    target = [].concat(...conf.workspaces.map((item: string) => getWorkSpaceTargets(item)));
  }else{
    target = [__dirname];
  }
  console.log(target);
};
run();
