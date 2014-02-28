define([], function () {
	"use strict";
	
	return {
		'_design/validation_global': {
			_id: '_design/validation_global',
			language: 'javascript',
			validate_doc_update: function (newDoc, oldDoc, userCtx) {
				if (userCtx.roles.indexOf('_admin') !== -1) {
					return null;
				}
				if (!newDoc._deleted) {
					if (!newDoc.type) {
						throw ({
							forbidden: 'All documents must have a type'
						});
					}
					if (userCtx.db !== 'commissar_user_' + userCtx.name && userCtx.roles.indexOf('+admin') === -1) {
						throw ({
							forbidden: 'Cannot alter documents outside your own database'
						});
					}
					if (newDoc.created) {
						if (String(parseInt(newDoc.created, 10)) !== String(newDoc.created)) {
							throw ({
								forbidden: 'Created timestamp must be in unix format'
							});
						}
						if (oldDoc && typeof oldDoc.created !== 'undefined' && newDoc.created !== oldDoc.created) {
							throw ({
								forbidden: 'Cannot alter created timestamp once set'
							});
						}
					}
					if (newDoc.updated && String(parseInt(newDoc.updated, 10)) !== String(newDoc.updated)) {
						throw ({
							forbidden: 'Updated timestamp must be in unix format'
						});
					}
				}
			}
		}
	};
	
});