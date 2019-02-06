(function($)
{
    /*
		ToDo: load the validation params from the validator automatically
	*/

    var defaults=
        {
          name:'files',
          url:'',
		  docicon:'',
          button_label:'Upload File...',
          dropzone_label: 'File Drop Zone',
          max_num_files:3,
          max_file_size:5048,
		  valid_extensions:'',
          error_txt:'Error',
          error_txt_max_num:'Exceeded max number of files',
          error_txt_max_size:'The file is larger than max. limit',
		  error_txt_extension:'Invalid file type'
        };
		
    $.fn.sfmFileUpload = function(options_param)
    {
        this.each(function(){ this.sfm_uploadobj = new sfm_FileUploadObj(options_param,this); });
        return this;
    };
    //Fix for browser drag problems
    //From: http://stackoverflow.com/questions/10253663/how-to-detect-the-dragleave-event-in-firefox-when-dragging-outside-the-window
    $.fn.draghover = function(options) 
    {
        return this.each(function() 
        {
            var collection = $();
            var self = $(this);
            self.on('dragenter', function(e) 
                {
                  if (collection.size() === 0) 
                  {
                    self.trigger('draghoverstart');
                  }
                  collection = collection.add(e.target);
                });

            self.on('dragleave', function(e) 
                {
                  // timeout is needed because Firefox 3.6 fires the dragleave event on
                  // the previous element before firing dragenter on the next one
                  setTimeout( function() 
                      {
                        collection = collection.not(e.target);
                        if (collection.size() === 0) {self.trigger('draghoverend');}          
                      }, 1);
                });
            self.on('drop',function(e)
            {
                collection = collection.not(e.target);
            });
        });
    };

    function sfm_FileUploadObj(options_param,baseobj)
    {
		var settings ={}; 

		
		var $file_list;
		var $dropzone;
		var num_files=0;
		
		settings = $.extend(defaults,options_param||{});
	
        var $file_field = $('input[type=file]',baseobj);
		$file_field.css(
                        {
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            fontFamily: 'Arial',
                            fontSize: '22px',
                            margin: 0,
                            padding: 0,
                            cursor: 'pointer',
                            opacity: 0                            
                        });
		
        $file_field.attr("multiple", "multiple");
        $file_field.get(0).settings = settings;
        
        num_files = 0;
        
        var $button_div = $("<div>",{'class':'upload_button'}).css(
                            {
								position: 'relative',
								overflow: 'hidden',
								direction: 'ltr'
                            }).text( settings.button_label );
		$file_field.wrap($button_div);
        
        var $scrollarea = $("<div>",{'class':'upload_scrollarea'});
        
        $dropzone = $('<div class="upload_drop_area"><span>' + settings.dropzone_label + '</span></div>').css({opacity: 0.8});
        
        $scrollarea.append($dropzone);
        
        $file_list = $("<ul>",{'class':'upload_files'});
        
        $scrollarea.append($file_list);
        
        $scrollarea.appendTo(baseobj);

		initFileUploadField($file_field.get(0),$file_list.get(0));
        
        $('input[type=file]',baseobj).live('replaceinput',function()
        {
            initFileUploadField(this,$file_list.get(0));
        });
				
        $file_field.fileupload(
            {
                dataType: 'json',
                url: $.jscComposeURL(settings.url,{'sfm_postfile':1}) ,
                dropZone:$dropzone,
				replaceFileInput:true,
				
				formData:function(form)
				{
					return {};
				},
                add:function(e,data)
                {
                    $dropzone.hide();
                    if(data.files.length > 0 )
                    {
						var fileinfo={name:data.files[0].name,size:data.files[0].size}
                        data.context = getFileListItem(fileinfo.name, fileinfo.size);
                        data.context.data('data',data);
						data.context.data('fileinfo',fileinfo);
                        $('.upload_statusbox',data.context).addClass('upload_progress');
						$('.upload_previewbox img',data.context).attr('src',settings.docicon);
                        $file_list.append(data.context);
                    }
                    if(validate(data))
                    {
                        num_files++;
                        data.submit();                    
                    }
					else
					{
						//clear the upload field
						$file_field.val('');
					}
                },
                progress:function (e, data) 
                {
                    $('.progress_size',data.context).text(formatSize(data.loaded));
                    
                    var perc = (data.loaded * 100 )/ data.total;
                    $('.progreslevel',data.context).css('width',perc+'%');
                },
                
                done: function (e, data) 
                {
					data.context.data('data',data);
					var fileinfo = data.context.data('fileinfo');
					if(data.result[0].error)
					{
						showError(data.context,data.result[0].error);
						return;
					}
					fileinfo.id = data.result[0].id;
					data.context.data('fileinfo',fileinfo);
					
                    var size =data.result[0].size;
					//clear the upload field so that the file is not
					//uploaded again
					$file_field.val('');

					updateToCompletedStatus(data.context,size);
					loadPreview(data.context,fileinfo.id);
                }
            });
            $(window).draghover().on(
            {
                'draghoverstart': function() { $dropzone.show(); },
                'draghoverend': function() { $dropzone.hide(); },
                'drop': function() { $dropzone.hide(); }
            });
 
		
		$.getJSON($.jscComposeURL(settings.url,{'sfm_upload_getlist':settings.name}),
			function(list)
			{
				$.each(list, function (i, fileinfo) 
				{
					var context = getFileListItem(fileinfo.name, fileinfo.size);
					context.data('fileinfo',fileinfo);
					
					$file_list.append(context);
					
					updateToCompletedStatus(context,fileinfo.size);
					loadPreview(context,fileinfo.id);
				});
			});
				
		function validate(data)
		{
			if(!data.fileInput[0].settings)
			{
				return true;
			}
			var settings = data.fileInput[0].settings;
			if( (num_files + 1 ) > settings.max_num_files )
			{
				showError(data.context, settings.error_txt_max_num);
				return false;
			}
			if(data.files.length > 0 && data.files[0].size > (settings.max_file_size*1024) )
			{
				showError(data.context, settings.error_txt_max_size);
				return false;        
			}
			
			if(data.files.length > 0 && settings.valid_extensions != '')
			{
				var found = sfm_is_valid_extension(data.files[0].name,settings.valid_extensions);
				if(!found)
				{
					showError(data.context, settings.error_txt_extension);
					return false;				
				}
			}
			return true;
		}
		
		function initFileUploadField(uploadfield, ul_obj)
		{
			uploadfield.sfm_list = ul_obj;
			uploadfield.sfm_validate = function(validator,value)
			{
				var ret = true;
				switch(validator)
				{
					case 'req_file':
							{
								if($('li div.upload_successbox',this.sfm_list).size()<=0){ret = false;}
							}
							break;
				}
				return ret;
			}
		}
		
		function loadPreview(context,id)
		{
			var img = new Image();
			$(img).load(function()
					{
						$('.upload_previewbox img',context)
						.attr('src',this.src);
						img = null;
					})
					.error(function()
					{
						$('.upload_previewbox img',context).attr('src',settings.docicon);
						img = null;
					})
					.attr('src', $.jscComposeURL(settings.url,{'sfm_filepreview':id,rand:Math.random()*10000}) );	
		}
		
		function updateToCompletedStatus(context,size)
		{
			$('.upload_statusbox',context)
				.html(getCompletedStatusMsg(size))
				.removeClass('upload_progress')
				.addClass('upload_successbox');	
		}
		function showError(context, msg)
		{
			$('.upload_statusbox',context).removeClass('upload_progress');
			
			$('.upload_statusbox',context)
							.html(settings.error_txt)
							.addClass('upload_errorbox')
							.attr('title', msg);
			
			var pos = $(context).position();
			$(context).closest('.upload_scrollarea').scrollLeft(pos.left);
			
			$('.upload_statusbox',context).qtip(
				{
				content:msg,
				style:{classes: 'ui-tooltip-simfatic'},
				show: {ready: true, target:$(context)},
				hide: {event: 'unfocus mouseleave',target:$(context)},
				position:{my: 'top left', at: 'bottom left',adjust:{x:10,y:-5}}
				});
		}
		
		
		
		function getFileListItem(filename,size)
		{
		   $file_item = $('<li>'+
			'<div class="upload_titlebox"><span class="titletext">'+filename+'</span> <span class="closebox">X</span> </div>'+
			'<div class="upload_previewbox"><img src="" /></div>'+
			'<div class="upload_statusbox"><div class="progressbox"><div class="progreslevel"></div></div> <div class="progress_size"></div></div>'+
			'</li>');
			$('.closebox',$file_item).bind('click',function(e)
			{
				var $li = $(this).closest('li');
				
				var data = $li.data('data');
				var fileinfo = $li.data('fileinfo');
				
				if (data && data.jqXHR)
				{
					data.jqXHR.abort();
				}

				if(fileinfo.id)
				{
					$.get($.jscComposeURL(settings.url,{'sfm_upload_file_delete':fileinfo.id}), 
						 function(response)
						 {
							if(response == 'error')
							{
								console.log('Error deleting file from the server');
							}
						 });
				}
				
				num_files--;
				$li.remove();
			});
		   return $file_item;
		}
		
		function getCompletedStatusMsg(size)
		{
			return '<span class="upload_size">' + formatSize(size) + '</span>';
		}
		
		function formatSize(bytes)
		{
			if (typeof bytes !== 'number') 
			{
				return '';
			}
			if (bytes >= 1000000000) 
			{
				return (bytes / 1000000000).toFixed(2) + ' GB';
			}
			else if (bytes >= 1000000) 
			{
				return (bytes / 1000000).toFixed(2) + ' MB';
			}
			else if (bytes >= 1000) 
			{
				return (bytes / 1000).toFixed(0) + ' KB'; 
			}
			return (bytes / 1000).toFixed(2) + ' KB'; 
		}
    }//sfm_FileUploadObj
})(jQuery);