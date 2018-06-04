angular.module('reviewCtrl',[])

.controller('reviewCtrl',['$scope','$http',function($scope,$http){
	
        var vm = this;
        vm.fields = [
            {label: 'Email', key: 'email'},
            {label: 'Project Title', key: 'project'},
            {label: 'Description', key: 'description'},
            {label: 'File name', key: 'filename'},
            {label: 'Process', key: 'process'},
            {label: 'Material', key: 'material'},
            {label: 'Estimated Cost', key: 'cost'},
            {label: 'Quantity', key: 'quantity'},
            {label: 'Review', key: 'review'},      
        ];

        vm.record = {};
        vm.records = [];
        $scope.value=0;  
        
        vm.getAllRecords = function() {
        	$http.post('/api/getreview').then(function(response){
                vm.records=response.data;
                console.log(response);
            }, function(response){
                console.log(response);
            });

        }

		vm.getAllRecords();

		vm.setpayment = function(recordid,data,comment){
			console.log(recordid);
			console.log(data);
            console.log(comment);
			$http.get('/api/setpayments/'+recordid , {params: {cost: data, comment:comment}}).then(function(response){
				console.log(response);
				vm.getAllRecords();
			},function(response){
				console.log(response);
				vm.getAllRecords();
			});
		
		}
		






}
]);