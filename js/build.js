Handlebars.registerHelper('formatDate', function(date) {
  return moment(date).format('Do MMMM YYYY, h:mm a');
});

$('[data-pdf-list-id]').each(function () {
  var $el = $(this);

  var data = Fliplet.Widget.getData($el.data('pdf-list-id'));
  data = _.assign({ search: false, sort: { by: 'name', order: 'asc' }}, data);

  var $listHolder = $el.find('.list-holder');

  var currentFiles;
  var pdfs;
  var search;

  function getFolderContents() {
    $el.find('.search-wrapper').attr('data-mode', 'loading');
    $el.find('.search-screen').addClass('loading');

    $el.find('.offline-notification').removeClass('show');
    $el.find('.offline-screen').removeClass('show');
    $el.find('.list').removeClass('hidden');

    currentFiles = [];
    $listHolder.html('');

    return Fliplet.Media.Folders.get(data).then(function (response) {
      if (!response.files.length || Fliplet.Env.get('development')) {
        response.files.push({
          id: 0,
          name: 'No files available in the selected folder',
          url: 'sample.pdf'
        });
      }

      pdfs = response.files.filter(function (file) {
        // Only PDF files to be shown on this component
        return file.url.match(/\.pdf(\?_=\d+)$/)
      });

      if (data.sort.by === 'createdAt') {
        pdfs = pdfs.map(function (file) {
          file.createdAt = new Date(file.createdAt);
          return file;
        });
      }

      pdfs = _.sortBy(pdfs, data.sort.by);

      if (data.sort.order === 'desc') {
        pdfs = pdfs.reverse();
      }

      pdfs.forEach(addFile);

      $el.find('.search-wrapper').attr('data-mode', 'default');
      $el.find('.search-screen').removeClass('loading');
      $el.find('.list').attr('data-view', 'default');
      $el.find('.first-load').addClass('hidden');

      return Promise.resolve();
    });
  }

  // Adds file item template
  function addFile(file) {
    currentFiles.push(file);
    var tpl = Fliplet.Widget.Templates['templates.list'];
    var html = tpl(file);

    $listHolder.append(html);
  }

  Fliplet.Navigator.onReady().then(function () {
    getFolderContents().then(function () {
      // success
      $el.find('.first-load').addClass('hidden');
    }, function () {
      // fail. perhaps device is offline?
      $el.find('.offline-notification').addClass('show');
      $el.find('.offline-screen').addClass('show');
      $el.find('.list').addClass('hidden');
      $el.find('.first-load').addClass('hidden');

      // load files when the device goes back online
      Fliplet.Navigator.onOnline(function () {
        getFolderContents();
      })
    })
  });

  // Click Search bar
  $(document).on('focus', '.list-search .search', function(){
    $(this).parents('.list').attr('data-mode', 'search');
    $(this).css( 'width', $(this).parents('.list-search').width() - $(this).siblings('.search-cancel').outerWidth() + 8 );
  })
  .on('keyup change paste', '.list-search .search', function () {
    var term = new RegExp(this.value, "i");
    $el.find('.list').removeClass('no-results');

    search = pdfs.filter(function (file) {
      return file.name.match(term);
    });

    $listHolder.empty();
    if (search.length === 0) {
      $el.find('.list').addClass('no-results');
    }
    search.forEach(addFile);
  });

  // Click Cancel button
  $(document).on('focus', '.list-search .search-cancel', function(){
    $el.find('.list').removeClass('no-results');
    $(this).parents('.list').attr('data-mode', 'list');
    $(this).siblings('.search').css( 'width', '' );
    $('.search').val('');
    $('.search').change();
  });

  // EVENTS
  $el.find('.list')
    .on('click', '.list-holder li', function() {
      var mediaId = $(this).attr('data-file-id');
      var pdfUrl = [
        Fliplet.Env.get('apiUrl'),
        'v1/media/files/' + mediaId + '/pdf',
        '?auth_token=' + Fliplet.User.getAuthToken()
      ].join('');
      Fliplet.Navigate.url(pdfUrl);
    });
});
