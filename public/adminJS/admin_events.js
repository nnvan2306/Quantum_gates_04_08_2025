// Đăng ký font hỗ trợ
const Font = Quill.import('formats/font');
Font.whitelist = ['arial', 'times', 'roboto', 'mono', 'serif', 'sans'];
Quill.register(Font, true);

// Khởi tạo Quill với toolbar đầy đủ
const quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: 'Nhập nội dung hoạt động...',
  modules: {
    toolbar: [
      [{ font: Font.whitelist }, { size: ['small', false, 'large', 'huge'] }],
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

// Các input và vùng preview
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('event-date');
const timeInput = document.getElementById('event-time');
const locationInput = document.getElementById('event-location');
const thumbnailInput = document.getElementById('thumbnail');

const previewTitle = document.getElementById('preview-title');
const previewDateTime = document.getElementById('preview-datetime');
const previewLocation = document.getElementById('preview-location');
const previewThumb = document.getElementById('preview-thumb');
const previewContent = document.getElementById('preview-content');

// Cập nhật preview mỗi khi có thay đổi
function updatePreview() {
  previewTitle.textContent = titleInput.value;
  previewDateTime.textContent = `${dateInput.value} ${timeInput.value}`;
  previewLocation.textContent = locationInput.value;
  previewThumb.src = thumbnailInput.value;
  previewContent.innerHTML = quill.root.innerHTML;
}

[titleInput, dateInput, timeInput, locationInput, thumbnailInput].forEach(input =>
  input.addEventListener('input', updatePreview)
);
quill.on('text-change', updatePreview);

// Submit lên server
function createEvent() {
  const eventData = {
    title: titleInput.value,
    date: dateInput.value,
    time: timeInput.value,
    location: locationInput.value,
    thumbnail: thumbnailInput.value,
    content: quill.root.innerHTML
  };

  fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  })
    .then(res => res.json())
    .then(() => {
      document.getElementById('result').innerText = '✅ Thêm hoạt động thành công!';
      titleInput.value = '';
      dateInput.value = '';
      timeInput.value = '';
      locationInput.value = '';
      thumbnailInput.value = '';
      quill.setContents([]);
      updatePreview();
    })
    .catch(err => {
      document.getElementById('result').innerText = '❌ Có lỗi khi thêm hoạt động';
      console.error(err);
    });
}
