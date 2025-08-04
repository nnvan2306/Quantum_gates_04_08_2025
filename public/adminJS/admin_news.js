const Font = Quill.import('formats/font');
Font.whitelist = ['arial', 'times', 'roboto', 'mono', 'serif', 'sans'];
Quill.register(Font, true);

const quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: 'Nhập nội dung bài viết...',
  modules: {
    toolbar: [
      [{ font: ['arial', 'times', 'roboto', 'mono', 'serif', 'sans'] }, { size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }
});

const titleInput = document.getElementById('title');
const thumbInput = document.getElementById('thumbnail');
const previewTitle = document.getElementById('preview-title');
const previewThumb = document.getElementById('preview-thumb');
const previewContent = document.getElementById('preview');

titleInput.addEventListener('input', () => {
  previewTitle.textContent = titleInput.value;
});

thumbInput.addEventListener('input', () => {
  previewThumb.src = thumbInput.value;
});

quill.on('text-change', () => {
  previewContent.innerHTML = quill.root.innerHTML;
});

function createNews() {
  const title = titleInput.value;
  const thumbnail = thumbInput.value;
  const content = quill.root.innerHTML;

  fetch('http://localhost:5000/api/news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, thumbnail, content })
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById('result').innerText = '✅ Thêm bài viết thành công!';
    titleInput.value = '';
    thumbInput.value = '';
    quill.setContents([]);
    previewTitle.textContent = '';
    previewThumb.src = '';
    previewContent.innerHTML = '';
  })
  .catch(err => {
    document.getElementById('result').innerText = '❌ Có lỗi khi thêm bài viết';
    console.error(err);
  });
}