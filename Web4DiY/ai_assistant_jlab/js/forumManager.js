export class ForumManager {
  constructor() {
    this.posts = new Map();
    this.setupEventListeners();
    this.currentPage = 1;
    this.postsPerPage = 10;
  }

  setupEventListeners() {
    // Move to separate file for forum page
    window.addEventListener('DOMContentLoaded', () => {
      this.loadForumContent();
    });
  }

  async loadForumContent() {
    if (!document.getElementById('forumContainer')) return; // Only load on forum page
    
    try {
      await this.loadPosts();
      this.setupForumInteractions();
      this.setupFilters();
      this.setupSearch();
      this.setupPagination();
    } catch (error) {
      console.error('Error loading forum content:', error);
      this.showError('Failed to load forum content');
    }
  }

  async loadPosts() {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate sample forum posts.
          
          interface Post {
            id: string;
            title: string;
            content: string;
            author: {
              username: string;
              avatar: string;
            };
            tags: string[];
            created_at: string;
            likes: number;
            comments: number;
            views: number;
          }
          
          interface Response {
            posts: Post[];
          }`,
          data: {}
        })
      });

      const data = await response.json();
      this.renderPosts(data.posts);
    } catch (error) {
      this.showError('Failed to load posts');
    }
  }

  renderPosts(posts) {
    const container = document.getElementById('forumPosts');
    if (!container) return;

    container.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
  }

  createPostHTML(post) {
    return `
      <article class="forum-post">
        <div class="post-author">
          <img src="${post.author.avatar}" alt="${post.author.username}" class="author-avatar">
          <div class="author-info">
            <h3>${post.author.username}</h3>
            <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="post-content">
          <h2 class="post-title">${post.title}</h2>
          <p>${post.content}</p>
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="post-stats">
          <span class="stat"><i class="fas fa-heart"></i> ${post.likes}</span>
          <span class="stat"><i class="fas fa-comment"></i> ${post.comments}</span>
          <span class="stat"><i class="fas fa-eye"></i> ${post.views}</span>
        </div>
        <div class="post-actions">
          <button class="like-btn" data-post-id="${post.id}">
            <i class="fas fa-heart"></i> Like
          </button>
          <button class="comment-btn" data-post-id="${post.id}">
            <i class="fas fa-comment"></i> Comment
          </button>
          <button class="share-btn" data-post-id="${post.id}">
            <i class="fas fa-share"></i> Share
          </button>
        </div>
      </article>
    `;
  }

  setupForumInteractions() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleLike(btn.dataset.postId));
    });

    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openCommentModal(btn.dataset.postId));
    });

    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', () => this.sharePost(btn.dataset.postId));
    });
  }

  setupFilters() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'forum-filters';
    filterContainer.innerHTML = `
      <select id="sortFilter">
        <option value="latest">Latest</option>
        <option value="popular">Most Popular</option>
        <option value="trending">Trending</option>
      </select>
      <select id="timeFilter">
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
      <select id="categoryFilter">
        <option value="all">All Categories</option>
        <option value="projects">Projects</option>
        <option value="tutorials">Tutorials</option>
        <option value="questions">Questions</option>
        <option value="showcase">Showcase</option>
      </select>
    `;

    document.getElementById('forumContainer')?.prepend(filterContainer);
  }

  setupSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'forum-search';
    searchContainer.innerHTML = `
      <div class="search-wrapper">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search posts..." id="forumSearch">
        <button class="advanced-search-btn">
          <i class="fas fa-sliders-h"></i>
        </button>
      </div>
    `;

    document.getElementById('forumContainer')?.prepend(searchContainer);
  }

  setupPagination() {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'forum-pagination';
    paginationContainer.innerHTML = `
      <button class="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> Previous
      </button>
      <div class="page-numbers">
        ${this.generatePageNumbers()}
      </div>
      <button class="next-page">
        Next <i class="fas fa-chevron-right"></i>
      </button>
    `;

    document.getElementById('forumContainer')?.appendChild(paginationContainer);
  }

  generatePageNumbers() {
    const totalPages = Math.ceil(this.posts.size / this.postsPerPage);
    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      pages += `
        <button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }
    return pages;
  }

  showError(message) {
    const event = new CustomEvent('notification', {
      detail: { message, type: 'error' }
    });
    document.dispatchEvent(event);
  }

  handleLike(postId) {
    // implement handleLike logic here
  }

  openCommentModal(postId) {
    // implement openCommentModal logic here
  }

  sharePost(postId) {
    // implement sharePost logic here
  }
}