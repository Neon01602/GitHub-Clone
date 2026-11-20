import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertCircle, ArrowLeft, Bell, BookOpen, Check, ChevronDown,
  CircleDot, Code2, Copy, ExternalLink, File, FileCode2, Folder,
  GitBranch, GitCommit, GitFork, GitPullRequest, Globe, Lock, LogOut,
  Menu, Plus, Search, Settings, Shield, Star, Users, X
} from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('cv_token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cv_user') || 'null'); } catch { return null; }
  });
  const [page, setPage] = useState('Overview');
  const [repos, setRepos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [repoTab, setRepoTab] = useState('Code');
  const [files, setFiles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [issues, setIssues] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [fileContent, setFileContent] = useState('');
  const [openFile, setOpenFile] = useState('');
  const [query, setQuery] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [repoForm, setRepoForm] = useState({ name: '', description: '', visibility: 'public' });
  const [issueForm, setIssueForm] = useState({ title: '', body: '' });
  const [prForm, setPrForm] = useState({ title: '', body: '', head: '', base: 'main' });
  const [modal, setModal] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }, [headers]);

  const loadRepos = useCallback(async () => {
    try {
      const data = await request('/repos' + (user ? '?owner=' + encodeURIComponent(user.username) : ''));
      setRepos(data.repositories || []);
    } catch (e) { setError(e.message); }
  }, [request, user]);

  useEffect(() => { loadRepos(); }, [loadRepos]);

  const loadRepository = useCallback(async (repo) => {
    setSelected(repo);
    setRepoTab('Code');
    setOpenFile('');
    setFileContent('');
    setError('');
    try {
      const prefix = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
      const [meta, fileData, branchData] = await Promise.all([
        request(prefix), request(prefix + '/files'), request(prefix + '/branches')
      ]);
      setSelected(meta.repository || repo);
      setFiles(fileData.files || []);
      setBranches(branchData.branches || ['main']);
    } catch (e) { setError(e.message); }
  }, [request]);

  const loadRepoTab = useCallback(async (tab) => {
    if (!selected) return;
    setRepoTab(tab);
    const prefix = `/repos/${encodeURIComponent(selected.owner)}/${encodeURIComponent(selected.name)}`;
    try {
      if (tab === 'Issues') setIssues((await request(prefix + '/issues')).issues || []);
      if (tab === 'Pull requests') setPulls((await request(prefix + '/pulls')).pullRequests || []);
    } catch (e) { setError(e.message); }
  }, [request, selected]);

  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const data = await request('/auth/' + authMode, { method: 'POST', body: JSON.stringify(authForm) });
      setToken(data.token); setUser(data.user);
      localStorage.setItem('cv_token', data.token);
      localStorage.setItem('cv_user', JSON.stringify(data.user));
      setNotice(authMode === 'register' ? 'Your CodeVault account is ready.' : 'Welcome back.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function createRepository(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await request('/repos', { method: 'POST', body: JSON.stringify(repoForm) });
      setModal(''); setRepoForm({ name: '', description: '', visibility: 'public' });
      await loadRepos(); setNotice('Repository created successfully.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function createIssue(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const prefix = `/repos/${selected.owner}/${selected.name}/issues`;
      await request(prefix, { method: 'POST', body: JSON.stringify(issueForm) });
      setIssueForm({ title: '', body: '' }); setModal(''); await loadRepoTab('Issues');
      setNotice('Issue opened.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function createPull(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const prefix = `/repos/${selected.owner}/${selected.name}/pulls`;
      await request(prefix, { method: 'POST', body: JSON.stringify(prForm) });
      setPrForm({ title: '', body: '', head: '', base: selected.defaultBranch || 'main' });
      setModal(''); await loadRepoTab('Pull requests'); setNotice('Pull request created.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function openRepositoryFile(file) {
    setOpenFile(file); setFileContent('Loading file…');
    try {
      const prefix = `/repos/${selected.owner}/${selected.name}/raw`;
      const response = await fetch(API + prefix + '?path=' + encodeURIComponent(file), { headers });
      if (!response.ok) throw new Error('Could not load file');
      setFileContent(await response.text());
    } catch (e) { setFileContent(e.message); }
  }

  function logout() {
    localStorage.removeItem('cv_token'); localStorage.removeItem('cv_user');
    setToken(''); setUser(null); setSelected(null); setPage('Overview');
  }

  const filteredRepos = repos.filter(r => `${r.name} ${r.description || ''} ${r.owner}`.toLowerCase().includes(query.toLowerCase()));
  const initials = (user?.username || 'C').slice(0, 1).toUpperCase();

  if (!user) return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={authenticate}>
        <div className="brand"><span className="brand-symbol"><Code2 size={20}/></span><span>codevault</span></div>
        <div className="auth-kicker">THE DEVELOPER PLATFORM</div>
        <h1>Build. Ship.<br/><span>Collaborate.</span></h1>
        <p className="subtle">Your code deserves a home. Create repositories, track work, and build together.</p>
        <div className="auth-fields">
          <label>Username<input required autoComplete="username" value={authForm.username} onChange={e=>setAuthForm({...authForm,username:e.target.value})} placeholder="your-username"/></label>
          {authMode === 'register' && <label>Email<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label>}
          <label>Password<input required minLength={8} type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 8 characters"/></label>
        </div>
        {error && <div className="alert"><AlertCircle size={15}/>{error}</div>}
        <button className="button primary wide" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
        <p className="auth-switch">{authMode === 'login' ? 'New to CodeVault?' : 'Already have an account?'} <button type="button" onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setError('')}}>{authMode==='login'?'Create an account':'Sign in'}</button></p>
        <div className="auth-foot"><Shield size={13}/> Secure authentication · Private repositories</div>
      </form>
    </main>
  );

  return (
    <div className="layout">
      <aside className={'sidebar ' + (mobileNav ? 'show' : '')}>
        <div className="brand"><span className="brand-symbol"><Code2 size={20}/></span><span>codevault</span></div>
        <div className="workspace-card"><div className="user-avatar">{initials}</div><div className="workspace-user"><b>{user.name || user.username}</b><small>@{user.username}</small></div><ChevronDown size={15}/></div>
        <div className="nav-caption">WORKSPACE</div>
        {[[BookOpen,'Overview'],[Folder,'Repositories'],[GitPullRequest,'Pull requests'],[CircleDot,'Issues'],[Activity,'Activity']].map(([Icon,label])=>
          <button key={label} className={'nav-link '+(!selected && page===label?'selected':'')} onClick={()=>{setSelected(null);setPage(label);setMobileNav(false);}}><Icon size={17}/>{label}{label==='Repositories'&&<span className="nav-count">{repos.length}</span>}</button>
        )}
        <div className="nav-caption second">ACCOUNT</div>
        <button className="nav-link" onClick={()=>{setSelected(null);setPage('Settings');setMobileNav(false)}}><Settings size={17}/>Settings</button>
        <div className="sidebar-bottom"><div className="sidebar-note"><Code2 size={15}/><span>Built for developers</span></div><button className="nav-link" onClick={logout}><LogOut size={17}/>Sign out</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)}><Menu size={19}/></button>
          <div className="breadcrumbs"><span>Workspace</span><b>/</b>{selected ? selected.name : page}</div>
          <div className="topbar-right">
            <div className="searchbox"><Search size={15}/><input placeholder="Search repositories…" value={query} onChange={e=>setQuery(e.target.value)}/><kbd>/</kbd></div>
            <button className="top-icon" title="Notifications"><Bell size={18}/></button><div className="user-avatar small">{initials}</div>
          </div>
        </header>

        <div className="page-content">
          {selected ? (
            <>
              <button className="back-link" onClick={()=>{setSelected(null);setPage('Repositories')}}><ArrowLeft size={15}/> All repositories</button>
              <div className="repo-heading">
                <div><div className="repo-owner">{selected.owner} <span>/</span></div><h1>{selected.name} <em>{selected.visibility==='private'?<Lock size={13}/>:<Globe size={13}/>} {selected.visibility}</em></h1><p>{selected.description || 'No description provided.'}</p></div>
                <div className="repo-actions"><button className="button secondary"><Star size={15}/> Star <span>{selected.stars || 0}</span></button><button className="button secondary"><GitFork size={15}/> Fork</button></div>
              </div>
              <div className="repo-tabs">{[['Code',Code2],['Issues',CircleDot],['Pull requests',GitPullRequest],['Activity',Activity],['Settings',Settings]].map(([label,Icon])=><button key={label} className={repoTab===label?'active':''} onClick={()=>loadRepoTab(label)}><Icon size={16}/>{label}{label==='Issues'&&issues.length>0?<span>{issues.length}</span>:null}</button>)}</div>
              {repoTab==='Code' && <div className="code-layout">
                <div className="branch-bar"><div><GitBranch size={15}/><b>{selected.defaultBranch || 'main'}</b><ChevronDown size={13}/></div><span>{branches.length} {branches.length===1?'branch':'branches'}</span><span>{files.length} files</span></div>
                {openFile ? <div className="file-view"><div className="file-toolbar"><button onClick={()=>setOpenFile('')}><ArrowLeft size={14}/> Back to files</button><b><FileCode2 size={14}/>{openFile}</b><button onClick={()=>navigator.clipboard?.writeText(fileContent)}><Copy size={14}/> Copy</button></div><pre>{fileContent}</pre></div> :
                  <div className="file-list">{files.length ? files.map(file=><button key={file} className="file-row" onClick={()=>openRepositoryFile(file)}><FileCode2 size={16}/><span>{file}</span><small>View file</small></button>) : <div className="empty-state"><Folder size={27}/><b>This repository is empty</b><p>Push your first commit to see files here.</p><code>git push -u origin main</code></div>}</div>}
              </div>}
              {repoTab==='Issues' && <section className="panel"><div className="panel-heading"><div><h2><CircleDot size={18}/> Issues</h2><p>Track bugs, tasks, and ideas.</p></div><button className="button primary" onClick={()=>setModal('issue')}><Plus size={15}/> New issue</button></div>{issues.map(i=><div className="list-row" key={i.id}><CircleDot size={17}/><div><b>{i.title}</b><small>#{String(i.id).slice(0,8)} opened by {i.author} · {i.state}</small></div><span className={'state '+i.state}>{i.state}</span></div>)}{!issues.length&&<div className="empty-state"><CircleDot size={27}/><b>No issues yet</b><p>When work needs tracking, open an issue.</p></div>}</section>}
              {repoTab==='Pull requests' && <section className="panel"><div className="panel-heading"><div><h2><GitPullRequest size={18}/> Pull requests</h2><p>Propose, review, and merge changes.</p></div><button className="button primary" onClick={()=>setModal('pull')}><Plus size={15}/> New pull request</button></div>{pulls.map(p=><div className="list-row" key={p.id}><GitPullRequest size={17}/><div><b>{p.title}</b><small>{p.head} → {p.base} · opened by {p.author}</small></div><span className={'state '+p.state}>{p.state}</span></div>)}{!pulls.length&&<div className="empty-state"><GitPullRequest size={27}/><b>No pull requests</b><p>Changes proposed for merging will appear here.</p></div>}</section>}
              {repoTab==='Activity' && <div className="empty-state panel"><Activity size={27}/><b>Repository activity</b><p>Recent commits and collaboration events will appear here.</p></div>}
              {repoTab==='Settings' && <div className="panel"><div className="panel-heading"><div><h2><Settings size={18}/> Repository settings</h2><p>Manage repository information and access.</p></div></div><div className="settings-row"><span>Repository name</span><b>{selected.name}</b></div><div className="settings-row"><span>Visibility</span><b>{selected.visibility}</b></div><div className="settings-row"><span>Default branch</span><b>{selected.defaultBranch || 'main'}</b></div><div className="settings-row"><span>Owner</span><b>{selected.owner}</b></div></div>}
            </>
          ) : (
            <>
              <div className="welcome-row"><div><div className="eyebrow">DEVELOPER WORKSPACE</div><h1>{page==='Overview'?'Welcome back, '+(user.name||user.username):page}</h1><p>Your code, your team, your next big idea.</p></div><button className="button primary" onClick={()=>setModal('repo')}><Plus size={16}/> New repository</button></div>
              {page==='Settings' ? <section className="panel"><div className="panel-heading"><div><h2><Settings size={18}/> Account settings</h2><p>Your CodeVault profile.</p></div></div><div className="settings-row"><span>Username</span><b>@{user.username}</b></div><div className="settings-row"><span>Email</span><b>{user.email}</b></div><div className="settings-row"><span>Account created</span><b>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</b></div></section> :
              <>
                <div className="stat-grid"><div className="stat-card"><span>Repositories</span><b>{repos.length}</b><small><Folder size={14}/> Your projects</small></div><div className="stat-card"><span>Public</span><b>{repos.filter(r=>r.visibility==='public').length}</b><small><Globe size={14}/> Open source</small></div><div className="stat-card"><span>Private</span><b>{repos.filter(r=>r.visibility==='private').length}</b><small><Lock size={14}/> Restricted access</small></div><div className="stat-card"><span>Branches</span><b>{repos.reduce((n,r)=>n+(r.branches?.length||1),0)}</b><small><GitBranch size={14}/> Across repositories</small></div></div>
                <section className="panel repo-panel"><div className="panel-heading"><div><h2>{page==='Overview'?'Your repositories':page}</h2><p>Explore and manage your projects.</p></div><button className="button secondary" onClick={()=>setModal('repo')}><Plus size={15}/> Create</button></div>
                  {filteredRepos.map(r=><button className="repository-row" key={r.id} onClick={()=>loadRepository(r)}><span className="repo-tile"><Code2 size={19}/></span><span className="repository-details"><b>{r.owner}/{r.name}</b><small>{r.description || 'No description provided.'}</small><span className="repository-meta"><i className={r.visibility==='private'?'private-dot':'public-dot'}/>{r.visibility}<GitBranch size={13}/>{r.defaultBranch||'main'}<Star size={13}/>{r.stars||0}<span>Updated {new Date(r.updatedAt||r.createdAt).toLocaleDateString()}</span></span></span><ExternalLink size={16} className="row-arrow"/></button>)}
                  {!filteredRepos.length&&<div className="empty-state"><Folder size={28}/><b>No repositories found</b><p>Create your first repository and start building.</p><button className="button primary" onClick={()=>setModal('repo')}><Plus size={15}/> New repository</button></div>}
                </section>
              </>}
            </>
          )}
          {error && <div className="toast error-toast"><AlertCircle size={15}/>{error}<button onClick={()=>setError('')}><X size={14}/></button></div>}
          {notice && <div className="toast"><Check size={15}/>{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
        </div>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={()=>setModal('')}><form className="dialog" onSubmit={modal==='repo'?createRepository:modal==='issue'?createIssue:createPull} onMouseDown={e=>e.stopPropagation()}>
        <div className="dialog-head"><div><h2>{modal==='repo'?'Create a new repository':modal==='issue'?'Open a new issue':'Create a pull request'}</h2><p>{modal==='repo'?'A place for your project to live.':modal==='issue'?'Describe what needs attention.':'Propose changes to a base branch.'}</p></div><button type="button" className="close-button" onClick={()=>setModal('')}><X size={18}/></button></div>
        {modal==='repo' ? <><label>Repository name<input required pattern="[A-Za-z0-9._-]+" value={repoForm.name} onChange={e=>setRepoForm({...repoForm,name:e.target.value})} placeholder="my-awesome-project"/></label><label>Description<input value={repoForm.description} onChange={e=>setRepoForm({...repoForm,description:e.target.value})} placeholder="What are you building?"/></label><label>Visibility<select value={repoForm.visibility} onChange={e=>setRepoForm({...repoForm,visibility:e.target.value})}><option value="public">Public</option><option value="private">Private</option></select></label></> :
        <><label>Title<input required value={modal==='issue'?issueForm.title:prForm.title} onChange={e=>modal==='issue'?setIssueForm({...issueForm,title:e.target.value}):setPrForm({...prForm,title:e.target.value})} placeholder="A clear, concise title"/></label><label>Description<textarea rows="5" value={modal==='issue'?issueForm.body:prForm.body} onChange={e=>modal==='issue'?setIssueForm({...issueForm,body:e.target.value}):setPrForm({...prForm,body:e.target.value})} placeholder="Add more context…"/></label>{modal==='pull'&&<><label>Compare branch<input required value={prForm.head} onChange={e=>setPrForm({...prForm,head:e.target.value})} placeholder="feature/my-change"/></label><label>Base branch<input value={prForm.base} onChange={e=>setPrForm({...prForm,base:e.target.value})}/></label></>}</>}
        {error&&<div className="alert"><AlertCircle size={15}/>{error}</div>}<div className="dialog-actions"><button type="button" className="button secondary" onClick={()=>setModal('')}>Cancel</button><button className="button primary" disabled={busy}>{busy?'Saving…':modal==='repo'?'Create repository':modal==='issue'?'Open issue':'Create pull request'}</button></div>
      </form></div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
