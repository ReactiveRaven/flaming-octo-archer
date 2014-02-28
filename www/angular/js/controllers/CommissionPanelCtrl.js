/* globals angular:false */
define(
    [
        'constants', 
        '../services/Authentication', 
        '../services/ParanoidScope', 
        '../services/CommissionManager', 
        '../directives/KommiExpandToFit',
        '../directives/KommiEnter'
    ], 
    function(constants) {
    "use strict";

    var CommissionPanelCtrlModule = angular.module(
        'commissar.controllers.CommissionPanelCtrl', [
            'commissar.services.ParanoidScope',
            'commissar.services.Authentication',
            'commissar.services.CommissionManager',
            'commissar.directives.KommiExpandToFit',
            'commissar.directives.KommiEnter',
        ]
    );

    CommissionPanelCtrlModule.controller(
        'CommissionPanelCtrl', 
        ['ParanoidScope', 'Authentication', 'CommissionManager', '$scope', 
        function(ParanoidScope, Authentication, CommissionManager, $scope) {            
            $scope.commissionPanel = {};
            
            CommissionManager.getCommissions().then(function (commissions) {
                $scope.kommissionerUser = {
                    name: CommissionManager.username
                };
                
                $scope.commissions = CommissionManager.commissions;
                
                $scope.commissionPanel.activeCommissionListDisclosed = true;
                $scope.commissionPanel.requestCommissionListDisclosed = true;
                $scope.commissionPanel.completeCommissionListDisclosed = false;
                
                $scope.commissionPanel.sendingReply = false;
                
                $scope.commissionPanel.selectedCommission = $scope.commissions[0];
            });
                
            $scope.commissionPanel.attachementsFromCommission = function(commission) {
                var attachments = [];
                if (commission) {
                    var attachments = [];
                    commission.messages.forEach(function(message) {
                        message.attachments.forEach(function(attachment) {
                            attachments.push(attachment);
                        });
                    });
                }
                return attachments;
            };
            
            $scope.commissionPanel.commissionHasAttachments = function(commission) {
                var attachments = $scope.commissionPanel.attachementsFromCommission(commission);
                return attachments.length > 0;
            };
            
            $scope.commissionPanel.formatDate = function(date) {
                return moment(date).format("MMM Do, YYYY");
            };
            
            $scope.commissionPanel.reply = function(replyBody) {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
                
                var replyMessage = {
                    sender: selectedCommission.artist,
                    date: new Date(),
                    body: selectedCommission.replyBody,
                    attachments: []
                }
                
                var updatedCommission = angular.copy(selectedCommission);
                updatedCommission.messages.unshift(replyMessage);
                delete updatedCommission.replyBody;
                delete updatedCommission.replyDisclosed;
                
                $scope.commissionPanel.sendingReply = true;
                
                CommissionManager.updateCommission(updatedCommission).then(function (revisedCommission) {
                    revisedCommission.replyBody = '';
                    revisedCommission.replyDisclosed = false;
                    var selectedCommissionIndex = $scope.commissions.indexOf(selectedCommission);
                    $scope.commissions[selectedCommissionIndex] = revisedCommission;
                    $scope.commissionPanel.sendingReply = false;
                },
                function () {
                    $scope.commissionPanel.sendingReply = false;
                });
            };
            
            $scope.commissionPanel.selectedCommissionShouldPromptForCompletenessConfirmation = function() {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
                if (selectedCommission) { 
                    var artistMarkedAndUserNotArtist = selectedCommission.artistMarkedAsCompleted && !$scope.commissionPanel.userIsSelectedCommissionArtist();
                    var buyerMarkedAndUserNotBuyer = selectedCommission.buyerMarkedAsCompleted && $scope.commissionPanel.userIsSelectedCommissionArtist();
                    
                    var artistAndBuyerAggreeSelectedCommissionIsComplete = selectedCommission.artistMarkedAsCompleted == selectedCommission.buyerMarkedAsCompleted;
                    
                    return (buyerMarkedAndUserNotBuyer || artistMarkedAndUserNotArtist) && !artistAndBuyerAggreeSelectedCommissionIsComplete;
                }
            };
            
            $scope.commissionPanel.selectedCommissionShouldShowCompletedMessage = function() {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
            
                if (selectedCommission) {
                    var artistMarkedAndUserIsArtist = selectedCommission.artistMarkedAsCompleted && $scope.commissionPanel.userIsSelectedCommissionArtist();
                    var buyerMarkedAndUserIsBuyer = selectedCommission.buyerMarkedAsCompleted && !$scope.commissionPanel.userIsSelectedCommissionArtist();
                    
                    var artistAndBuyerAggreeSelectedCommissionIsComplete = selectedCommission.artistMarkedAsCompleted == selectedCommission.buyerMarkedAsCompleted;
                
                    return (artistMarkedAndUserIsArtist || buyerMarkedAndUserIsBuyer) && !artistAndBuyerAggreeSelectedCommissionIsComplete;
                }
            };
            
            $scope.commissionPanel.userIsSelectedCommissionArtist = function() {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
                return selectedCommission.artist.name == $scope.kommissionerUser.name;
            };
            
            $scope.commissionPanel.markSelectedCommissionAsCompleted = function() {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
                if ($scope.commissionPanel.userIsSelectedCommissionArtist()) {
                    selectedCommission.artistMarkedAsCompleted = true;
                } else {
                    selectedCommission.buyerMarkedAsCompleted = true;
                }
                
                $scope.commissionPanel.changeSelectedCommissionStatusToCompletedIfCommissionIsCompleted();
            };
            
            $scope.commissionPanel.toggleSelectedCommissionCompletion = function() {
                if ($scope.commissionPanel.userIsSelectedCommissionArtist()) {
                    $scope.commissionPanel.selectedCommission.artistMarkedAsCompleted = !$scope.commissionPanel.selectedCommission.artistMarkedAsCompleted;
                } else {
                    $scope.commissionPanel.selectedCommission.buyerMarkedAsCompleted = !$scope.commissionPanel.selectedCommission.buyerMarkedAsCompleted;
                }
                $scope.commissionPanel.changeSelectedCommissionStatusToCompletedIfCommissionIsCompleted();
            };
            
            $scope.commissionPanel.markSelectedCommissionAsIncomplete = function() {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
                selectedCommission.artistMarkedAsCompleted = false;
                selectedCommission.buyerMarkedAsCompleted = false;
            };
            
            $scope.commissionPanel.changeSelectedCommissionStatusToCompletedIfCommissionIsCompleted = function() {
                var selectedCommission = $scope.commissionPanel.selectedCommission;
            
                if (selectedCommission.artistMarkedAsCompleted && selectedCommission.buyerMarkedAsCompleted) {
                    selectedCommission.status = 'complete';
                }
            };
        }
    ]);

    CommissionPanelCtrlModule.config(function($routeProvider) {
        $routeProvider.when('/commissions', {
            templateUrl: constants.templatePrefix + 'commissionPanel.html',
            controller: 'CommissionPanelCtrl'
        });
    });
    
    return CommissionPanelCtrlModule;
});