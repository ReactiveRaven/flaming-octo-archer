define([], function () {
	"use strict";
	
	return {
        '_design/validation_user': {
            _id: '_design/validation_user',
            language: 'javascript',
            validate_doc_update: function (newDoc, oldDoc, userCtx) {

                if (userCtx.roles.indexOf('_admin') !== -1) {
                    return null;
                }

                if (typeof newDoc._id === 'undefined') {
                    throw ({forbidden: 'ID is missing'});
                }

                if (!newDoc.author && oldDoc && !newDoc._deleted) {
                    throw ({forbidden: 'Cannot create a document without an author field'});
                }
                if (newDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1 && oldDoc && !newDoc._deleted) {
                    throw ({forbidden: 'Cannot forge authorship as another user'});
                }
                if (newDoc._id.indexOf(newDoc.author) !== 0 && oldDoc && !newDoc._deleted) {
                    throw ({forbidden: 'IDs must start with your username'});
                }
                if (oldDoc && oldDoc.type && newDoc.type !== oldDoc.type && !newDoc._deleted) {
                    throw ({forbidden: 'Cannot change the type of a document'});
                }
                if (oldDoc && oldDoc.author && newDoc.author !== oldDoc.author && !newDoc._deleted) {
                    throw ({forbidden: 'Cannot change the author of a document'});
                }
                if (!newDoc.author && !oldDoc) {
                    throw ({forbidden: 'Cannot create a document without an author field'});
                }
                if (newDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1 && !oldDoc) {
                    throw ({forbidden: 'Cannot forge authorship as another user'});
                }
                if (newDoc._id.indexOf(newDoc.author) !== 0 && !oldDoc) {
                    throw ({forbidden: 'IDs must start with your username'});
                }
                if (newDoc._deleted && oldDoc && oldDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1) {
                    throw ({forbidden: 'Cannot delete as you are not the author'});
                }
            },
            "filters": {
                "isPublished": function () {

                }
            }
        },
        '_design/validation_user_media': {
            _id: '_design/validation_user_media',
            language: 'javascript',
            validate_doc_update: function (newDoc, oldDoc, userCtx) {
                if (userCtx.roles.indexOf('_admin') !== -1) {
                    return null;
                }
                if (newDoc.type === 'media') {
                    if (typeof newDoc.title === 'undefined') {
                        throw ({forbidden: 'Media must have a title'});
                    }
                    if (typeof newDoc.created === 'undefined') {
                        throw ({forbidden: 'Media must have a created timestamp'});
                    }
                    if (typeof newDoc.mediaType !== 'undefined' && newDoc.mediaType !== 'image') {
                        throw ({forbidden: 'Invalid media type' });
                    }
                }
            },
            views: {
                all: {
                    map: function (document) {
                        if (typeof document.type === 'string' && document.type === 'media') {
                            emit(null, document);
                        }
                    }
                },
                byAuthor: {
                    map: function (document) {
                        if (typeof document.type === 'string' && document.type === 'media') {
                            emit(document.author, document);
                        }
                    }
                },
                noThumbnails: {
                    map: function (document) {
                        if (document.type && document.type === 'media' && !document.thumbnails) {
                            emit(null, document);
                        }
                    }
                }
            }
        }
    };
    
});