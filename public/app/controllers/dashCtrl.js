angular.module('dashCtrl',[])


    .controller('dashCtrl',['$scope','$http','$rootScope',function($scope,$http,$rootScope){

        var vm = this;
        vm.fields = [
            {label: 'Project Title', key: 'project'},
            {label: 'Description', key: 'description'}, 
            {label: 'File name', key: 'filename'},
            {label: 'Process', key: 'process'},
            {label: 'Material', key: 'material'},
            {label: 'Estimated Cost per item*', key: 'cost'},
            {label: 'Quantity', key: 'quantity'},
            {label: 'Email', key: 'email'}
              
        ];

        vm.record = {};
        vm.records = [];
        console.log('record details:');
        console.log(vm.record);
        
        $scope.branches = [
          { id: 'FDM', name: 'FDM'},
          { id: 'SLS', name: 'SLS'},
          { id: 'SLA', name: 'SLA'},
          { id: 'FDM', name: 'Don\'t know'}
        ];

        $scope.locations = [
            { id: 'PLA', branchId: 'FDM', name: 'PLA'},
            { id: 'ABS', branchId: 'FDM', name: 'ABS'},
            { id: 'PA 2200', branchId: 'SLS', name: 'PA 2200'},
            { id: 'Nylon 12', branchId: 'SLS', name: 'Nylon 12'},
            { id: 'Visijet', branchId: 'SLA', name: 'Visijet'},
            { id: 'Accura 25', branchId: 'SLA', name: 'Accura 25'},
            { id: 'Accura 60', branchId: 'SLA', name: 'Accura 60'}
        ];


        $scope.loadLocations = function(branchId) {
          console.log('Selected BranchId: ' + branchId);
          vm.record.process= branchId; 
        }

        $scope.loadMaterial = function(material) {
            console.log('Selected material: ' + material);
            vm.record.material= material; 
        }

        $scope.filesChanged=function(elm){
            $scope.files=elm.files
            $scope.$apply();
        }

        $scope.upload = function(){
            var fd= new FormData()
            angular.forEach($scope.files, function(file){
                fd.append('file',file)
            })
            $http.post('api/upload',fd,{
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}

            })
            .success(function(d){
                console.log(d);
            })
        }

        vm.handleError = function(response) {
            console.log(response.status + " - " + response.statusText + " - " + response.data);
        }

        vm.getAllRecords = function() {
            $http.post('api/me').then(function(data){
                vm.record.email=data.data.username;
                var data=vm.record.email;
                console.log(data);
                $http.get('/api/records', {params: {name: data}}).then(function(response){
                    vm.records = response.data;
                }, function(response){
                    vm.handleError(response);
                });
            })
        }

        vm.quote=function(data){
            $http.post('api/quote/'+data).then(function(response){
                console.log(response.data);
                vm.getAllRecords();
            })

        }

        vm.getAllRecords();
        
        vm.saveRecord = function() {
            $('#reset').prop('selectedIndex',0);
            $('#reset2').prop('selectedIndex',0);


            var fd= new FormData()
            angular.forEach($scope.files, function(file){
                fd.append('file',file)
            })
            $http.post('api/upload',fd,{
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}

            })
            .success(function(d){
                console.log(d);
                var $el = $('#reset3');
                $el.wrap('<form>').closest('form').get(0).reset();
                $el.unwrap();


            console.log(vm.record);
            vm.addRecord();
        
        })

        }

        vm.addRecord = function() {
            console.log(vm.record);
            $http.post('/api/records', vm.record).then(function(response){
                console.log(response);
                vm.record = {};
                vm.getAllRecords();           
            }, function(response){
                vm.handleError(response);
            });
        }

        vm.deleteRecord = function(recordid) {

            var r = confirm("Delete project?\n");
            if (r == true) {
            $http.delete('/api/records/'+recordid).then(function(response){
                console.log("Deleted");
                vm.getAllRecords();
            }, function(response){
                vm.handleError(response);
            })
            } 
        }

        vm.checkout = function(recordid) {
            console.log(recordid);
            $rootScope.rid=recordid;
        }
      
    }

])