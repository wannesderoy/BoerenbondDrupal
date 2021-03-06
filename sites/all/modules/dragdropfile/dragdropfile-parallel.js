
(function ($) {



Drupal.behaviors.dragDropFile = {
  attach: function(context, settings) {

    settings.ajax && $.each(settings.ajax, function(base, cfg) {
      if (cfg.element && cfg.element.type === 'submit' && cfg.element.value == Drupal.t('Upload')) {
        cfg.overriddenByDragDropFile = true;
        var options = Drupal.ajax[base].options,
          $submit = $('#' + base);

        if (options.overriddenByDragDropFile || !$submit.length || !$submit.hasClass('i-am-dragdropfile')) return;

        options.overriddenByDragDropFile = true;
        var oldBeforeSend = options.beforeSend;
        options.beforeSend = function(xhr, options) {
          // Do Drupal magic here.
          oldBeforeSend.call(this, xhr, options);

          // Do my magic here.
          if (options.files) {
            $.each(options.files, function(i, file) {
              options.data.append(options.inputName, file);
            });
          }
        };

        var $wrapper = $('#' + cfg.wrapper);
        $wrapper.data('ajax-base', base);
        $wrapper.bind({
          dragover: function(e) {
            e.preventDefault();
            var $this = $(this);

            $this.addClass('over');
          }, // dragover

          dragleave: function(e) {
            e.preventDefault();
            var $this = $(this);

            $this.removeClass('over');
          }, // dragleave

          drop: function(e) {
            var $this = $(this);
            $this.removeClass('over');

            if ('INPUT' == e.target.nodeName) {
              console.log("DON'T handle drop event");
              return;
            }

            e.preventDefault();

            // All of these won't change until the next Drupal.attachBehaviors, because all files are sent in the same request.
            var base = $this.data('ajax-base'),
              settings = Drupal.settings.ajax[base],
              options = Drupal.ajax[base].options,
              files = Array.prototype.slice.call(e.originalEvent.dataTransfer.files),
              $input = $this.find('input.form-file').first(),
              input = $input[0],
              $submit = $input.closest('.form-item').find(Drupal.settings.dragDropFile.submitButtonSelector).first(),
              $form = $submit.closest('form'),
              inputName = $input.attr('name');

            // Append only as many files as are allowed.
            var max = !input.multiple ? 1 : parseFloat($input.attr('max'));
            if (max) {
              files = files.slice(0, max);
            }

            // Validate files.
            if ($input.data('validate') == 'settings' && Drupal.settings.file && Drupal.settings.file.elements && Drupal.settings.file.elements['#' + input.id]) {
              var fakeInput = document.createElement('input'),
                fails = 0;
              for (var i=0, L=files.length; i<L; i++) {
                var fileName = files[i].name,
                  extensions = Drupal.settings.file.elements['#' + input.id];
                fakeInput.value = fileName;
                var valid = Drupal.file.validateExtension.call(fakeInput, {data: {extensions: extensions}}) !== false;
                if (!valid) {
                  fails++;
                  delete files[i];
                }
              }

              if (fails) {
                $('.file-upload-js-error').remove();

                var error = Drupal.t('@fails of @total files invalid.', {
                  "@fails": fails,
                  "@total": L
                });
                $input.closest('div.form-managed-file').prepend('<div class="messages error file-upload-js-error">' + error + '</div>');
              }

              files = files.filter(function(el) { return !!el; });
              if (!files.length) {
                return;
              }
            }

            // 'Unset' all file inputs.
            $form.find('input[type="file"]').val('');
            var fileInputs = $form.find('input[type="file"]').each(function() {
              var $this = $(this);
              $this.data('actualInputName', this.name);
              $this.removeAttr('name');
            });

            // Fire normal submit and append file at the very last moment.
            options.files = files;
            options.inputName = inputName;
            $submit.trigger(settings.event);

            // Reset all file inputs.
            fileInputs.each(function() {
              var $this = $(this);
              $this.attr('name', $this.data('actualInputName'));
              $this.removeData('actualInputName');
            });

          } // drop
        }).addClass('dragdropfile-processed'); // bind events
      }
    });

  }
};



})(jQuery);
