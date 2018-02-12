angular.module('dashCtrl',[])

    .controller('dashCtrl',['$scope','$http', function($scope,$http){
        $scope.filesChanged=function(elm){
            $scope.files=elm.files
            $scope.$apply();
        }
        $scope.upload=function(){
            var fd= new FormData()
            angular.forEach($scope.files,function(file){
                fd.append('file',file)
            })
            $http.post('api/upload',fd,
            {
                transformRequest: angular.identity,
                headers:{'Content-Type':undefined}
            })
            .success(function(d){
                console.log(d)
            })
        }
        }
    ])