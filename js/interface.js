(function () {

var $folderList = $('#folder_list');
var templates = {
  folder: template('folder'),
  app: template('app'),
  organisation: template('organisation')
};

var data = Fliplet.Widget.getData();
var widgetId = Fliplet.Widget.getDefaultId();

function initialise() {
  Fliplet.Media.Folders.get({
    appId: Fliplet.Env.get('appId')
  }).then(function (response) {
    response.folders.forEach(addFolder);
    return Fliplet.Apps.get();
  }).then(function (apps) {
    apps.forEach(addApp);
    return Fliplet.Organizations.get();
  }).then(function (organisations) {
    organisations.forEach(addOrganisationFolder);
    initialiseData();
  });
}

// Adds app root folder template
function addApp(app) {
  $folderList.append(templates.app(app));
}

// Adds folder item template
function addFolder(folder) {
  $folderList.append(templates.folder(folder));
}

// Adds organisation item template
function addOrganisationFolder(org) {
  $folderList.append(templates.organisation(org));
}

// Templating
function template(name) {
  return Handlebars.compile($('#template-' + name).html());
}

function save() {
  var $el = $folderList.find('option:selected');
  var val = $el.val();

  data.appID = '';
  data.folderID = '';
  data.organisationID = '';

  if ($el.data('app')) {
    data.appID = val;
  } else if ($el.data('organisation')) {
    data.organisationID = val;
  } else {
    data.folderID = val;
  }

  Fliplet.Widget.save(data).then(function () {
    Fliplet.Studio.emit('reload-page-preview');
    Fliplet.Widget.complete();
  });
}

Fliplet.Widget.onSaveRequest(function () {
  save();
});

$folderList.on('change', function() {
  var selectedValue = $(this).val();
  var selectedText = $(this).find("option:selected").text();
  $('.section.show').removeClass('show');
  $('#' + selectedValue + 'Section').addClass('show');
  $(this).parents('.select-proxy-display').find('.select-value-proxy').html(selectedText);
});

$('#help_tip').on('click', function() {
  alert("During beta, please use live chat and let us know what you need help with.");
});

function initialiseData() {
  if (!data) {
    return;
  }

  var $context;

  if (data.appID) {
    $context = $folderList.find('[data-app][value="'+data.appID+'"]');
  } else if (data.organisationID) {
    $context = $folderList.find('[data-organisation][value="'+data.organisationID+'"]');
  } else if (data.folderID) {
    $context = $folderList.find('[data-folder][value="'+data.folderID+'"]');
  }

  if ($context) {
    $context.attr("selected","selected");
  }

  $folderList.change();
}

initialise();

})();