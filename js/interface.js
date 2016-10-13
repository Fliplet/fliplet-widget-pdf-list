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

  $('.image-library')
    .on('dblclick', '[data-folder-id]', function () {
      var $el = $(this);
      var id = $el.data('folder-id');
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
    .on('dblclick', '[data-app-id]', function () {
      var $el = $(this);
      var id = $el.data('app-id');
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
    .on('dblclick', '[data-organization-id]', function () {
      var $el = $(this);
      var id = $el.data('organization-id');
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
    .on('click', '[data-folder-id]', function () {
      var $el = $(this);
      // Removes any selected folder
      $('.image').not(this).each(function(){
        $(this).removeClass('selected');
      });

      if ($el.hasClass('selected')) {
        $('.folder-selection span').html('Select a folder below');
        data = {};
      } else {
        $('.folder-selection span').html('You have selected an image');
        data = { folderId: $el.data('folder-id') };
      }

      $el.toggleClass('selected');
    })
    .on('click', '[data-app-id]', function () {
      var $el = $(this);
      // Removes any selected folder
      $('.image').not(this).each(function(){
        $(this).removeClass('selected');
      });

      // Selects clicked folder or deselects clicked folder
      $el.toggleClass('selected');
      $('.folder-selection').html('You have selected an app folder');
      data = { appId: $el.data('app-id') };
    })
    .on('click', '[data-organization-id]', function () {
      var $el = $(this);
      // Removes any selected folder
      $('.image').not(this).each(function(){
        $(this).removeClass('selected');
      });

      // Selects clicked folder or deselects clicked folder
      $el.toggleClass('selected');
      $('.folder-selection span').html('You have selected an organization folder');
      data = { organizationId: $el.data('organization-id') };
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

  Fliplet.Widget.onSaveRequest(function () {
    Fliplet.Widget.save(data).then(function () {
      Fliplet.Widget.complete();
    });
  });
})();
