/**
 * 主脚本文件，用于处理多语言内容加载
 */

/**
 * 根据语言加载内容
 * @param {string} lang - 语言代码 ('en' 或 'zh')
 */
function loadContent(lang) {
  // 加载新闻数据
  loadNews(lang);
  
  // 加载论文数据
  loadPapers(lang);
}

/**
 * 加载新闻数据
 * @param {string} lang - 语言代码
 */
async function loadNews(lang) {
  try {
    const response = await fetch('data/news.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    const newsList = document.getElementById('news-list');
    
    if (newsList) {
      // 清空现有内容
      newsList.innerHTML = '';
      
      // 确保选择了正确的语言数据
      const newsItems = data[lang] || data['en']; // 默认回退到英文
      
      // 填充新闻列表
      newsItems.forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        
        if (item.highlight) {
          li.style.color = '#e91e63';
        }
        
        li.innerHTML = `<strong>[${item.date}]</strong> ${item.content}`;
        newsList.appendChild(li);
      });
    }
  } catch (error) {
    console.error('加载新闻数据失败:', error);
    const newsList = document.getElementById('news-list');
    if (newsList) {
      newsList.innerHTML = `<li>${lang === 'zh' ? '加载新闻失败，请稍后再试。' : 'Failed to load news, please try again later.'}</li>`;
    }
  }
}

/**
 * 加载论文数据
 * @param {string} lang - 语言代码
 */
async function loadPapers(lang) {
  try {
    const response = await fetch('data/papers.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 加载精选论文
    loadFeaturedPapers(data.featured[lang] || data.featured['en'], lang);
    
    // 加载其他论文
    loadOtherPapers(data.other[lang] || data.other['en'], lang);
  } catch (error) {
    console.error('加载论文数据失败:', error);
    const selectedPapers = document.getElementById('selected-papers');
    const otherPublications = document.getElementById('other-publications');
    
    const errorMessage = lang === 'zh' ? '加载论文失败，请稍后再试。' : 'Failed to load papers, please try again later.';
    
    if (selectedPapers) selectedPapers.innerHTML = `<p>${errorMessage}</p>`;
    if (otherPublications) otherPublications.innerHTML = `<li>${errorMessage}</li>`;
  }
}

/**
 * 加载精选论文
 * @param {Array} papers - 论文数组
 * @param {string} lang - 语言代码
 */
function loadFeaturedPapers(papers, lang) {
  const selectedPapers = document.getElementById('selected-papers');
  if (!selectedPapers) return;
  
  // 清空现有内容
  selectedPapers.innerHTML = '';
  
  // 生成每篇精选论文的HTML
  papers.forEach(paper => {
    // 创建论文展示的表格
    const paperElement = document.createElement('table');
    paperElement.style.width = '100%';
    paperElement.style.border = '0';
    paperElement.style.borderSpacing = '0';
    paperElement.style.borderCollapse = 'separate';
    paperElement.style.marginRight = 'auto';
    paperElement.style.marginLeft = 'auto';
    
    // 设置表格内容
    paperElement.innerHTML = `
      <tbody>
        <tr onmouseout="paper_stop_${generateId(paper.title)}()" onmouseover="paper_start_${generateId(paper.title)}()">
          <td style="padding:20px;width:20%;vertical-align:middle">
            <div class="one">
              <div class="two" id="paper_image_${generateId(paper.title)}">
                <img src="${paper.image}" width="100%">
              </div>
              <img src="${paper.image}" width="100%">
            </div>
            <script type="text/javascript">
              function paper_start_${generateId(paper.title)}() {
                document.getElementById('paper_image_${generateId(paper.title)}').style.opacity = "1";
                document.getElementById('paper_image_${generateId(paper.title)}').style.transition = "opacity 0.3s ease-in-out";
              }
              function paper_stop_${generateId(paper.title)}() {
                document.getElementById('paper_image_${generateId(paper.title)}').style.opacity = "0";
              }
              paper_stop_${generateId(paper.title)}();
            </script>
          </td>
          <td style="padding:20px;width:80%;vertical-align:middle">
            <a class="papertitle" href="${paper.url}" target="_blank">${paper.title}</a>
            <a href="${paper.pdf}" class="pdf-link" target="_blank">[PDF]</a>
            <br>
            ${paper.authors}
            <br>
            <em>${paper.journal}</em>, ${paper.year}.   <strong>  ${paper.impact}</strong> 
            <br>
            <p>${paper.abstract}</p>
          </td>
        </tr>
      </tbody>
    `;
    
    selectedPapers.appendChild(paperElement);
  });
}

/**
 * 加载其他论文
 * @param {Array} papers - 论文数组
 * @param {string} lang - 语言代码
 */
function loadOtherPapers(papers, lang) {
  const otherPublications = document.getElementById('other-publications');
  if (!otherPublications) return;
  
  // 清空现有内容
  otherPublications.innerHTML = '';
  
  // 为每篇论文创建列表项
  papers.forEach(paper => {
    const li = document.createElement('li');
    
    const noteStr = paper.note ? `<br>${paper.note}` : '';
    
    li.innerHTML = `
      ${paper.title}
      <a href="${paper.pdf}" class="pdf-link" target="_blank">[PDF]</a>
      <br>
      ${paper.authors}<br>
      <em>${paper.journal}</em>, ${paper.year}. <strong>${paper.impact}</strong>${noteStr}
    `;
    
    otherPublications.appendChild(li);
  });
}

/**
 * 从论文标题生成一个用于DOM ID的安全字符串
 * @param {string} title - 论文标题
 * @returns {string} - 安全的ID字符串
 */
function generateId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 20); // 使ID不会太长
}

/**
 * 设置语言偏好
 * @param {string} lang - 语言代码
 */
function setLanguagePreference(lang) {
  // 在cookie中保存用户语言偏好，有效期一年
  document.cookie = `preferredLanguage=${lang}; path=/; max-age=${60*60*24*365}`;
}

/**
 * 获取cookie中的值
 * @param {string} name - cookie名称
 * @returns {string|null} - cookie值或null
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
