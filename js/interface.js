(function () {
  var data = Fliplet.Widget.getData();
  var $imagesContainer = $('.image-library');
  var templates = {
    folder: template('folder'),
    app: template('app'),
    organization: template('organization'),
    noFiles: template('nofiles')
  };

  function addFolder(folder) {
    $imagesContainer.append(templates.folder(folder));
  }

  function addApp(app) {
    $imagesContainer.append(templates.app(app));
  }

  function addOrganization(organization) {
    $imagesContainer.append(templates.organization(organization));
  }

  function noFiles() {
    $imagesContainer.html(templates.noFiles());
  }

  function template(name) {
    return Handlebars.compile($('#template-' + name).html());
  }

  var upTo = [{ back: openRoot, name: 'Root'}];
  var folders,
      apps,
      organizations;

  function getApps() {
    return Fliplet.Apps
      .get()
      .then(function (apps) {
        return apps.filter(function (app) {
          return !app.legacy;
        })
      });
  }

  function openRoot() {
    // Clean library container
    $imagesContainer.html('');

    // Update paths
    updatePaths();

    var organizationId = Fliplet.Env.get('organizationId');
    return Promise.all([
      Fliplet.Organizations.get(),
      getApps()
    ])
      .then(function renderRoot(values) {
        organizations = values[0];
        apps = values[1];

        values[0].forEach(addOrganization);
        values[1].forEach(addApp)
      })
  }

  function openFolder(folderId) {
    Fliplet.Media.Folders.get({ type: 'folders', folderId: folderId })
      .then(renderFolderContent);
  }

  function openApp(appId) {
    Fliplet.Media.Folders.get({ type: 'folders', appId: appId })
      .then(renderFolderContent);
  }

  function openOrganization(organizationId) {
    Fliplet.Media.Folders.get({ type: 'folders', organizationId: organizationId })
      .then(renderFolderContent);
  }

  function renderFolderContent(values) {
    $('.folder-selection span').html('Select an folder below')
    $imagesContainer.html('');

    if (!values.folders.length) {
      return noFiles();
    }

    folders = values.folders;

    // Render folders and files
    _.sortBy(values.folders, ['name']).forEach(addFolder);
  }

  function enableSearch() {
    if ($('#file_search_yes').is(':checked')) {
      return data.search = true;
    }

    data.search = false;
  }

  /*
   * data should store one off orgId/appId/folderId
   */
  function cleanSelectedFolder() {
    data.organizationId = null;
    data.appId = null;
    data.folderId = null;
  }

  function loadSettings() {
    data = _.assign({ search: false, sort: { by: 'name', order: 'asc' }}, data);
    if (data.search) {
      $('#file_search_yes').prop("checked", true);
    } else {
      $('#file_search_no').prop("checked", true);
    }

    $('#select_sort_by').val(data.sort.by);
    $('#select_sort_order').val(data.sort.order);
    $('#select_sort_by, #select_sort_order').change();
  }

  $('#select_sort_by').on('change', function() {
    data.sort.by = $(this).val();
  });

  $('#select_sort_order').on('change', function() {
    data.sort.order = $(this).val();
  });

  $('#select_sort_by, #select_sort_order').on('change', function(){
    var selectedText = $(this).find("option:selected").text();
    $(this).parents('.select-proxy-display').find('.select-value-proxy').html(selectedText);
  });

  $('input[name="file_search"]:radio').on('change', enableSearch);
  $('.image-library')
    .on('dblclick', '[data-type="folder"]', function () {
      var $el = $(this);
      var id = $el.data('id');
      var backItem;

      // Store to nav stack
      backItem = _.find(folders, ['id', id]);
      backItem.back = function () {
        openFolder(id);
      };
      upTo.push(backItem);

      // Open
      openFolder(id);

      // Update paths
      updatePaths();
    })
    .on('dblclick', '[data-type="app"]', function () {
      var $el = $(this);
      var id = $el.data('id');
      var backItem;

      // Store to nav stack
      backItem = _.find(apps, ['id', id]);
      backItem.back = function () {
        openApp(id);
      };
      upTo.push(backItem);

      // Open
      openApp(id);

      // Update paths
      updatePaths();
    })
    .on('dblclick', '[data-type="organization"]', function () {
      var $el = $(this);
      var id = $el.data('id');
      var backItem;

      // Store to nav stack
      backItem = _.find(organizations, ['id', id]);
      backItem.back = function () {
        openOrganization(id);
      };
      upTo.push(backItem);

      // Open
      openOrganization(id);

      // Update paths
      updatePaths();

    })
    .on('click', '[data-type]', function () {
      var $el = $(this);
      var type = $el.data('type');
      // Removes any selected folder
      $('.folder').not(this).each(function(){
        $(this).removeClass('selected');
      });
      cleanSelectedFolder();

      if ($el.hasClass('selected')) {
        $('.folder-selection span').html('Select a folder below');
      } else {
        $('.folder-selection span').html('You have selected a folder');
        data[type + 'Id'] = $el.data('id');
      }

      $el.toggleClass('selected');
    });

  $('.back-btn').click(function () {
    if (upTo.length === 1) {
      return;
    }

    upTo.pop();
    upTo[upTo.length-1].back();
    updatePaths();
  });

  function updatePaths() {
    if (upTo.length === 1) {
      // Hide them
      $('.back-btn').hide();
      $('.breadcrumbs-select').hide();

      return;
    }

    // Show them
    $('.breadcrumbs-select').show();
    $('.back-btn').show();

    // Parent folder
    $('.up-to').html(upTo[upTo.length - 2].name);

    // Current folder
    $('.helper strong').html(upTo[upTo.length - 1].name);
  }

  // init
  openRoot();
  loadSettings();

  Fliplet.Widget.onSaveRequest(function () {
    // Validations
    if (!data.organizationId && !data.appId && !data.folderId) {
      return Fliplet.Navigate.popup({
        popupMessage: '- Select a folder',
        popupTitle: 'Invalid settings'
      });
    }


    Fliplet.Widget.save(data).then(function () {
      Fliplet.Widget.complete();
    });
  });
})();
