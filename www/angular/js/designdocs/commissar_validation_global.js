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
			},
			"filters": {
				"should_copy_to_private": function () {
					return true;
				},
				"should_copy_to_public": function (doc, req) {
					return (
						// Replication status is 'public'
						typeof doc.replication !== 'undefined' &&
						typeof doc.replication.status !== 'undefined' &&
						doc.replication.status === 'public' &&
						// DB is 'commissar_public'
						typeof req.query !== 'undefined' &&
						typeof req.query.x_target === 'commissar_public'
					);
				},
				"should_copy_to_personal": function (doc, req) {
					return (
						(
							// Document has author
							typeof doc.author !== 'undefined' &&
							// Current database's username matches author
							typeof req.query !== 'undefined' &&
							typeof req.query.x_target !== 'undefined' &&
							'commissar_user_' + doc.author === req.query.x_target
						) ||
						(
							// Target is a user db
							typeof req.query !== 'undefined' &&
							typeof req.query.x_target !== 'undefined' &&
							req.query.x_target.indexOf("commissar_user_") === 0 &&
							// Replication status is 'shared'
							typeof doc.replication !== 'undefined' &&
							typeof doc.replication.status !== 'undefined' &&
							doc.replication.status === 'shared' &&
							// Current database's username appears in 'involved'
							typeof doc.replication.involved.indexOf(req.query.x_target.substr(15)) !== -1
						) ||
						(
							// Is a design document
							doc.id.indexOf("_design/") === 0
						)
					);
				}
			}
		}
	};
	
});