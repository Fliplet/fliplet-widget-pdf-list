var $folderList = $('#folder_list');
var templates = {
  folder: template('folder'),
  app: template('app')
};

var data = Fliplet.Widget.getData();
var widgetId = Fliplet.Widget.getDefaultId();

function getFolder() {
  Fliplet.Media.Folders.get({
    appId: Fliplet.Env.get('appId')
  }).then(function (response) {
    Fliplet.Apps.get( Fliplet.Env.get('appId') ).then(function (apps) {
      apps[0].name = "Root folder";
      apps.forEach(addApp);
    });
    response.folders.forEach(addFolder);
  }).then(initialiseData);
}

// Adds app root folder template
function addApp(app) {
  $folderList.append(templates.app(app));
}

// Adds folder item template
function addFolder(folder) {
  $folderList.append(templates.folder(folder));
}

// Templating
function template(name) {
  return Handlebars.compile($('#template-' + name).html());
}

function save(notifyComplete) {

  data.appID = '';
  data.folderID = '';

  if ( $('#folder_list option:selected').attr('data-app') !== undefined ) {
    data.appID = $('#folder_list option:selected').val();
  } else {
    data.folderID = $('#folder_list option:selected').val();
  }

  if(notifyComplete) {
    Fliplet.Widget.save(data).then(function () {
      Fliplet.Studio.emit('reload-page-preview');
      Fliplet.Widget.complete();
    });
  }
}

Fliplet.Widget.onSaveRequest(function () {
  save(true);
});

$('#folder_list').on('change', function() {
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
  if (data != undefined ) {
    if (data.appID != '') {
      $('#folder_list [data-app][value="'+data.appID+'"]').attr("selected","selected");
      $('#folder_list').change();
    } else {
      $('#folder_list [data-folder][value="'+data.appID+'"]').attr("selected","selected");
      $('#folder_list').change();
    }
  }
}

getFolder();
