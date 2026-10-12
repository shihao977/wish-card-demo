# GitHub + Netlify 部署步骤

## 方案 A：最快上线，直接使用 Netlify Drop

1. 打开 `https://app.netlify.com/drop`；
2. 将整个 `心愿卡_本地留存版` 文件夹拖进去；
3. 等待上传和部署完成；
4. Netlify 会生成一个公开网址；
5. 在 Netlify 后台把随机子域名改成想要的名称；
6. 该项目不依赖后端，不需要 Build command。

适合快速拿到作品链接。  
缺点：不自动关联 GitHub，后续更新需要重新拖拽或再绑定 Git。

## 方案 B：推荐用于简历和长期维护

### 第一步：安装 GitHub Desktop

访问：

`https://desktop.github.com/`

安装后使用 GitHub 账号登录。

### 第二步：将项目发布到 GitHub

1. 打开 GitHub Desktop；
2. 选择 `File` → `Add local repository`；
3. 选择文件夹：
   `C:\Users\华为\Desktop\7\薯 作业\心愿卡_本地留存版`
4. 如果提示不是 Git 仓库，选择 `Create a repository`；
5. 仓库名建议：`wish-card-demo`；
6. 描述建议：
   `An AI-powered two-sided gift decision demo built with HTML, CSS and JavaScript.`
7. 选择公开仓库或私有仓库；
8. 点击 `Publish repository`；
9. 等待上传完成。

### 第三步：将 GitHub 仓库连接到 Netlify

1. 打开 `https://app.netlify.com/`；
2. 使用 GitHub 账号登录；
3. 点击 `Add new site`；
4. 选择 `Import an existing project`；
5. 选择 `GitHub`；
6. 选择刚发布的 `wish-card-demo` 仓库；
7. 构建设置填写：
   - Build command：留空；
   - Publish directory：`.`；
   - Functions directory：留空；
8. 点击 `Deploy site`；
9. 等待部署完成；
10. 在 `Site configuration` → `Domain management` 中修改站点名称。

### 第四步：后续更新

每次使用 GitHub Desktop：

1. 修改本地文件；
2. 填写 Summary；
3. 点击 `Commit to main`；
4. 点击 `Push origin`；
5. Netlify 会自动重新部署。

## 命令行方式（可选）

如果以后安装了 Git，可以使用：

```bash
cd "C:\Users\华为\Desktop\7\薯 作业\心愿卡_本地留存版"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/wish-card-demo.git
git push -u origin main
```

然后在 Netlify 导入该仓库。

## Netlify 设置检查

- Build command：留空；
- Publish directory：`.`；
- 不需要环境变量；
- 不依赖 Node.js；
- 不依赖 Python；
- 不依赖 REDcowork；
- 不需要真实后端接口。
