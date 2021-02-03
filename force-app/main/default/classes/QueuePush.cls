public with sharing class QueuePush implements Queueable, Database.AllowsCallouts {
    List<Id> leadIds = new List<Id>();

    public QueuePush(List<Id> ids) {
        this.leadIds = ids;
    }
    public void execute(QueueableContext context) {
        List<Lead> leads = [SELECT Id FROM Lead WHERE ID IN :leadIds];
        String message = 'New cars have arrived!';
        for (Lead lead : leads) {
            WebPushService.ServiceInput input = new WebPushService.ServiceInput();
            input.message = message;
            input.recordId = lead.Id;
            input.setSubscription = true;

            WebPushService.invokeWebPushService(input);
        }
    }
}
