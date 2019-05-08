$(function () {
    var $blogContent = $('#blog .blog-content');
    var data = {
        rss_url: 'https://medium.com/feed/@vicho_'
    };
    $.get('https://api.rss2json.com/v1/api.json', data, function (response) {
        if (response.status == 'ok') {
            var $post,
                $content,
                $images,
                $img,
                post,
                content,
                index;
            for (index = 0; (index < response.items.length && index < 3); index++) {
                var subIndex;
                post = response.items[index];
                content = $(post.content.trim()).text();
                
                $images = $(post.content).find('img');
                
                if ($images.length) {
                    for(subIndex = 0; subIndex < $images.length; subIndex++) {
                        $img = $($images[subIndex]);
                        if ($img.attr('src')) {
                            $img = $('<img>')
                                .addClass('img-responsive')
                                .attr('src', $img.attr('src'));
                            break;
                        }
                    }
                }

                $content = $('<div>')
                    .addClass('post-content')
                    .append($('<h3>')
                        .text(post.title))
                    .append($('<p>')
                        .addClass('blog-post-date')
                        .text(post.pubDate)
                        .prepend($('<b>').text('Posteado el ')))
                    .append($('<p>')
                        .text(content.length > 120 ? content.substring(0, 120).trim() + '...' : content))
                    .append($('<a>')
                        .addClass('read-more-btn')
                        .attr('href', post.link)
                        .attr('target', '_blank')
                        .text('Leer más'));

                $post = $('<div>')
                    .addClass('single-blog')
                    .append($img)
                    .append($content);

                $blogContent.append($('<div>')
                    .addClass('col-sm-4')
                    .append($post));
            }
        }
    });
});