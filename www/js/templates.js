define([], function () {return function (app) {app.run(['$templateCache',function($templateCache) {   'use strict';

  $templateCache.put('angular/templates/admin.html',
    "<h1 id=\"adminPanelTitle\">Admin Panel</h1>\n" +
    "\n" +
    "<a id=\"adminPanelLinkUploadDesignDocs\" data-ng-click=\"pushDesignDocs()\" data-ng-show=\"!pushingDesignDocs\" class=\"btn btn-danger\">Push Design Documents</a>\n" +
    "\n" +
    "<div class='alert alert-danger' data-ng-bind='pushDesignDocsErrors' data-ng-show='!pushingDesignDocs && pushDesignDocsErrors'></div>\n" +
    "\n" +
    "<a id=\"adminPanelLinkGotoFuton\" data-ng-show=\"!pushingDesignDocs\" href=\"/couchdb/_utils/\" class=\"btn btn-danger\">Go to Futon</a>"
  );


  $templateCache.put('angular/templates/commissionPanel.html',
    "<div class=\"commission-panel\" ng-controller=\"CommissionPanelCtrl\">\n" +
    "    <h2 class=\"commission-panel-header\">\n" +
    "        Commissions\n" +
    "    </h2>\n" +
    "    <div class=\"commissions-lists\">\n" +
    "        <div class=\"commissions-list active-commissions-list\">\n" +
    "            <h3 class=\"commissions-list-header\" ng-click=\"commissionPanel.activeCommissionListDisclosed = !commissionPanel.activeCommissionListDisclosed\">\n" +
    "                Active Commissions\n" +
    "            </h3>\n" +
    "            <div class=\"commissions-list-toggle active-commissions-list-toggle\" ng-class=\"{ 'disclosed-commission-list-toggle': commissionPanel.activeCommissionListDisclosed }\"></div>\n" +
    "            <ul ng-if=\"commissionPanel.activeCommissionListDisclosed\">\n" +
    "                <li class=\"commission active-commission\" ng-class=\"{ 'commission-with-unread-messages': commission.unreadMessageCount &gt; 0, 'selected-commission': commission == commissionPanel.selectedCommission }\" ng-repeat=\"commission in commissions | filter: { status: 'active' }\" ng-click=\"commissionPanel.selectedCommission = commission\">\n" +
    "                    <div class=\"commission-person-image\" ng-class=\"{ 'commission-person-image-generic': !commission.buyer.image }\">\n" +
    "                        <img ng-if=\"commission.buyer.image\" ng-src=\"{{ commission.buyer.image }}\">\n" +
    "                    </div>\n" +
    "                    <h4 class=\"commission-title\">\n" +
    "                        {{ commission.title }}\n" +
    "                    </h4>\n" +
    "                    <p class=\"commission-person-name\">\n" +
    "                        {{ commission.buyer.name }}\n" +
    "                    </p>\n" +
    "                    <div class=\"commisssion-last-updated-date\">\n" +
    "                        {{ commissionPanel.formatDate(commission.lastUpdated) }}\n" +
    "                    </div>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "        <div class=\"commissions-list request-commissions-list\">\n" +
    "            <h3 class=\"commissions-list-header\" ng-click=\"commissionPanel.requestCommissionListDisclosed = !commissionPanel.requestCommissionListDisclosed\">\n" +
    "                Requests\n" +
    "            </h3>\n" +
    "            <div class=\"commissions-list-toggle request-commissions-list-toggle\" ng-class=\"{ 'disclosed-commission-list-toggle': commissionPanel.requestCommissionListDisclosed}\"></div>\n" +
    "            <ul ng-if=\"commissionPanel.requestCommissionListDisclosed\">\n" +
    "                <li class=\"commission request-commission\" ng-class=\"{ 'commission-with-unread-messages': commission.unreadMessageCount &gt; 0, 'selected-commission': commission == commissionPanel.selectedCommission }\" ng-repeat=\"commission in commissions | filter: { status: 'request' }\" ng-click=\"commissionPanel.selectedCommission = commission\">\n" +
    "                    <div class=\"commission-person-image\" ng-class=\"{ 'commission-person-image-generic': !commission.buyer.image }\">\n" +
    "                        <img ng-if=\"commission.buyer.image\" ng-src=\"{{ commission.buyer.image }}\">\n" +
    "                    </div>\n" +
    "                    <h4 class=\"commission-title\">\n" +
    "                        {{ commission.title }}\n" +
    "                    </h4>\n" +
    "                    <p class=\"commission-person-name\">\n" +
    "                        {{ commission.buyer.name }}\n" +
    "                    </p>\n" +
    "                    <div class=\"commisssion-last-updated-date\">\n" +
    "                        {{ commissionPanel.formatDate(commission.lastUpdated) }}\n" +
    "                    </div>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "        <div class=\"commissions-list complete-commissions-list\">\n" +
    "            <h3 class=\"commissions-list-header\" ng-click=\"commissionPanel.completeCommissionListDisclosed = !commissionPanel.completeCommissionListDisclosed\">\n" +
    "                Completed\n" +
    "            </h3>\n" +
    "            <div class=\"commissions-list-toggle complete-commissions-list-toggle\" ng-class=\"{ 'disclosed-commission-list-toggle': commissionPanel.completeCommissionListDisclosed}\"></div>\n" +
    "            <ul ng-if=\"commissionPanel.completeCommissionListDisclosed\">\n" +
    "                <li class=\"commission complete-commission\" ng-class=\"{ 'commission-with-unread-messages': commission.unreadMessageCount &gt; 0, 'selected-commission': commission == commissionPanel.selectedCommission }\" ng-repeat=\"commission in commissions | filter: { status: 'complete' }\" ng-click=\"commissionPanel.selectedCommission = commission\">\n" +
    "                    <div class=\"commission-person-image\" ng-class=\"{ 'commission-person-image-generic': !commission.buyer.image }\">\n" +
    "                        <img ng-if=\"commission.buyer.image\" ng-src=\"{{ commission.buyer.image }}\">\n" +
    "                    </div>\n" +
    "                    <h4 class=\"commission-title\">\n" +
    "                        {{ commission.title }}\n" +
    "                    </h4>\n" +
    "                    <p class=\"commission-person-name\">\n" +
    "                        {{ commission.buyer.name }}\n" +
    "                    </p>\n" +
    "                    <div class=\"commisssion-last-updated-date\">\n" +
    "                        {{ commissionPanel.formatDate(commission.lastUpdated) }}\n" +
    "                    </div>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"commission-actions\">\n" +
    "        <a \n" +
    "            class=\"commission-action commission-action-reply btn active\" \n" +
    "            ng-click=\"commissionPanel.selectedCommission.replyDisclosed = true\"\n" +
    "        >\n" +
    "                Reply\n" +
    "        </a> \n" +
    "        <a \n" +
    "            class=\"commission-action commission-action-mark-as-complete btn\" \n" +
    "            ng-class=\"{ 'active commission-action-mark-as-complete-marked': commissionPanel.selectedCommissionShouldShowCompletedMessage() }\" \n" +
    "            ng-click=\"commissionPanel.toggleSelectedCommissionCompletion()\" \n" +
    "            ng-if=\"commissionPanel.selectedCommission.status != 'complete'\"\n" +
    "        >\n" +
    "                Mark as complete\n" +
    "        </a>\n" +
    "    </div>\n" +
    "    <div class=\"commission-conversation\" ng-class=\"{ 'commission-conversation-with-attachments': commissionPanel.commissionHasAttachments(commissionPanel.selectedCommission) }\">\n" +
    "        <div class=\"commission-message commission-complete-prompt\" ng-if=\"commissionPanel.selectedCommissionShouldPromptForCompletenessConfirmation()\">\n" +
    "            <p>\n" +
    "                <span ng-if=\"commissionPanel.selectedCommission.buyerMarkedAsCompleted\">The buyer</span> <span ng-if=\"commissionPanel.selectedCommission.artistMarkedAsCompleted\">The artist</span> has marked this commission as complete.<br>\n" +
    "            </p>\n" +
    "            <p>\n" +
    "                Is the commission complete?\n" +
    "            </p>\n" +
    "            <p class=\"commission-complete-prompt-actions\">\n" +
    "                <a class=\"btn success\" ng-click=\"commissionPanel.markSelectedCommissionAsCompleted()\">Yes</a> <a class=\"btn danger\" ng-click=\"commissionPanel.markSelectedCommissionAsIncomplete()\">No</a>\n" +
    "            </p>\n" +
    "        </div>\n" +
    "        <div class=\"commission-message commission-complete-message\" ng-if=\"commissionPanel.selectedCommissionShouldShowCompletedMessage()\">\n" +
    "            <p>\n" +
    "                You have marked this commission as complete.\n" +
    "            </p>\n" +
    "            <p>\n" +
    "                Waiting for \n" +
    "                <span ng-if=\"commissionPanel.commissionPanel.userIsSelectedCommissionArtist()\">\n" +
    "                    the buyer\n" +
    "                </span> \n" +
    "                <span ng-if=\"!commissionPanel.commissionPanel.userIsSelectedCommissionArtist()\">\n" +
    "                    the artist\n" +
    "                </span> \n" +
    "                to respond.\n" +
    "            </p>\n" +
    "        </div>\n" +
    "        <div class=\"commission-message commission-message-reply\" ng-if=\"commissionPanel.selectedCommission.replyDisclosed\">\n" +
    "            <div class=\"commission-person-image commission-message-person-image\" ng-class=\"{ 'commission-person-image-generic': !commissionPanel.selectedCommission.artist.image }\">\n" +
    "                <img ng-if=\"commissionPanel.selectedCommission.artist.image\" ng-src=\"{{ commissionPanel.selectedCommission.artist.image }}\">\n" +
    "            </div>\n" +
    "            <div class=\"commission-message-sender\">\n" +
    "                {{ commissionPanel.selectedCommission.artist.name }}\n" +
    "            </div>\n" +
    "            <div class=\"commission-message-body\">\n" +
    "                <textarea \n" +
    "                    autofocus=\"\" \n" +
    "                    kommi-expand-to-fit=\"\" \n" +
    "                    kommi-enter=\"commissionPanel.reply()\" \n" +
    "                    ng-model=\"commissionPanel.selectedCommission.replyBody\" \n" +
    "                    class=\"commission-message-reply-body kommi-expand-to-fit\"\n" +
    "                    ng-disabled=\"commissionPanel.sendingReply\"\n" +
    "                    ng-class=\"{ 'commission-message-reply-body-sending-reply': commissionPanel.sendingReply }\"\n" +
    "                >\n" +
    "                </textarea>\n" +
    "            </div>\n" +
    "            <div ng-if=\"message.attachments.length &gt; 0\" ng-repeat=\"attachment in message.attachments\" class=\"commission-message-attachments\">\n" +
    "                <div class=\"commission-message-attachment\">\n" +
    "                    {{ attachment.name }} - <span class=\"commission-attachment-size\">{{ attachment.size }}K</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"commission-message\" ng-repeat=\"message in commissionPanel.selectedCommission.messages\" ng-class=\"{ 'commission-message-with-attachments': message.attachments.length &gt; 0 }\">\n" +
    "            <div class=\"commission-person-image commission-message-person-image\" ng-class=\"{ 'commission-person-image-generic': !commission.buyer.image }\">\n" +
    "                <img ng-if=\"message.sender.image\" ng-src=\"{{ message.sender.image }}\">\n" +
    "            </div>\n" +
    "            <div class=\"commission-message-sender\">\n" +
    "                {{ message.sender.name }}\n" +
    "            </div>\n" +
    "            <div class=\"commission-message-body\">\n" +
    "                {{ message.body }}\n" +
    "            </div>\n" +
    "            <div ng-if=\"message.attachments.length &gt; 0\" ng-repeat=\"attachment in message.attachments\" class=\"commission-message-attachments\">\n" +
    "                <div class=\"commission-message-attachment\">\n" +
    "                    {{ attachment.name }} - <span class=\"commission-attachment-size\">{{ attachment.size }}K</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <h4 class=\"commission-request-header\">\n" +
    "            Commission request for\n" +
    "        </h4>\n" +
    "        <div class=\"commission-request-details\">\n" +
    "            <table class=\"commission-details-table\" border=\"0\">\n" +
    "                <tr>\n" +
    "                    <td class=\"commission-details-cell commission-description\">\n" +
    "                        {{ commissionPanel.selectedCommission.description }}\n" +
    "                    </td>\n" +
    "                    <td class=\"commission-details-cell commission-price\">\n" +
    "                        <span class=\"commission-currency-symbol\">£</span><!--\n" +
    "                     --><span class=\"commission-price-dollars\">{{ commissionPanel.selectedCommission.price.toFixed(2).split('.')[0] }}</span><!--\n" +
    "                     --><span class=\"commission-price-seperator\">.</span><!--\n" +
    "                     --><span class=\"commission-price-cents\">{{ commissionPanel.selectedCommission.price.toFixed(2).split('.')[1] }}</span>\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "                <tr ng-repeat=\"addon in commissionPanel.selectedCommission.addons\">\n" +
    "                    <td class=\"commission-details-cell commission-description\">\n" +
    "                        {{ addon.description }}\n" +
    "                    </td>\n" +
    "                    <td class=\"commission-details-cell commission-price\">\n" +
    "                        <span class=\"commission-currency-symbol\">£</span><!--\n" +
    "                     --><span class=\"commission-price-dollars\">{{ addon.price.toFixed(2).split('.')[0] }}</span><!--\n" +
    "                     --><span class=\"commission-price-seperator\">.</span><!--\n" +
    "                     --><span class=\"commission-price-cents\">{{ addon.price.toFixed(2).split('.')[1] }}</span>\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "        <div class=\"commission-request-total\">\n" +
    "            <table class=\"commission-details-table\" border=\"0\">\n" +
    "                <tr>\n" +
    "                    <td class=\"commission-details-cell commission-description\">\n" +
    "                        Total\n" +
    "                    </td>\n" +
    "                    <td class=\"commission-details-cell commission-price\">\n" +
    "                        <span class=\"commission-currency-symbol\">£</span><!--\n" +
    "                     --><span class=\"commission-price-dollars\">{{ commissionPanel.selectedCommission.totalPrice.toFixed(2).split('.')[0] }}</span><!--\n" +
    "                     --><span class=\"commission-price-seperator\">.</span><!--\n" +
    "                     --><span class=\"commission-price-cents\">{{ commissionPanel.selectedCommission.totalPrice.toFixed(2).split('.')[1] }}</span>\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"commission-files\" ng-if=\"commissionPanel.commissionHasAttachments(commissionPanel.selectedCommission)\">\n" +
    "        <h4 class=\"commission-files-header\">\n" +
    "            Commission files\n" +
    "        </h4>\n" +
    "        <div ng-repeat=\"attachment in commissionPanel.attachementsFromCommission(commissionPanel.selectedCommission)\">\n" +
    "            <div class=\"commission-attachment\">\n" +
    "                {{ attachment.name }} - <span class=\"commission-attachment-size\">{{ attachment.size }}K</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>"
  );


  $templateCache.put('angular/templates/index.html',
    "Hello :)"
  );


  $templateCache.put('angular/templates/logout.html',
    "<h1>You are now logged out</h1>"
  );


  $templateCache.put('angular/templates/welcome.html',
    "<h1 id=\"welcomeTitle\">Welcome!</h1>"
  );
 }]);};});