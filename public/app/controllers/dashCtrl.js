angular.module('dashCtrl',[])

    .controller('dashCtrl',['$scope','$http','$rootScope','$window',function($scope,$http,$rootScope,$window){

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
        console.log(vm.records);
        
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
          console.log('Selected process: ' + branchId);
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
                    console.dir(vm.records[0].review);
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
           /* var fileInput = $('#reset3');
            var maxSize = 100000000;
            
                if(fileInput.get(0).files.length){
                    var fileSize = fileInput.get(0).files[0].size; // in bytes
                    if(fileSize>maxSize){
                        alert('File size is more then 150MB.\nReduce the resolution while exporting the stl file');
                        return false;
                    }
                }else{
                    alert('choose file, please');
                    return false;
                }
            */

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


    
if ($window.location.pathname === '/dashworkflow') 
{
    var videoPlayButton, videoWrapper = document.getElementsByClassName('video-wrapper')[0],
    video = document.getElementsByTagName('video')[0],
    videoMethods = {
        renderVideoPlayButton: function() {
            if (videoWrapper.contains(video)) {
                this.formatVideoPlayButton()
                video.classList.add('has-media-controls-hidden')
                videoPlayButton = document.getElementsByClassName('video-overlay-play-button')[0]
                videoPlayButton.addEventListener('click', this.hideVideoPlayButton)
            }
        },

        formatVideoPlayButton: function() {
            videoWrapper.insertAdjacentHTML('beforeend', '\
                <svg class="video-overlay-play-button" viewBox="0 0 200 200" alt="Play video">\
                    <circle cx="100" cy="100" r="90" fill="none" stroke-width="15" stroke="#fff"/>\
                    <polygon points="70, 55 70, 145 145, 100" fill="#fff"/>\
                </svg>\
            ')
        },

        hideVideoPlayButton: function() {
            video.play()
            videoPlayButton.classList.add('is-hidden')
            video.classList.remove('has-media-controls-hidden')
            video.setAttribute('controls', 'controls')
        }
    }

    videoMethods.renderVideoPlayButton()
}
      
    }

])