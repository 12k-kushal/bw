angular.module('myordersCtrl',[])

.controller('myordersCtrl',['$scope','$http','$rootScope','$window',function($scope,$http,$rootScope,$window){
	
        var vm = this;
        if ($window.location.pathname === '/dashorders') vm.myorders = true;
        if ($window.location.pathname === '/invoice') vm.invoice = true;
        console.log($window.location.pathname);
        vm.fields = [
            {label: 'Project Title', key: 'projectname'},
            {label: 'Date', key: 'date'},
            {label: 'Email', key: 'email'},
            {label: 'Material', key: 'material'},
            {label: 'Process', key: 'process'},
            {label: 'Quantity', key: 'quantity'},
            {label: 'Total', key: 'costpostgst'},  
        ];

        vm.record = {};
        vm.records = [];
          
        $scope.myFunction=function(){
            window.print();
        }

        vm.getinvoicedetails = function(data){
            console.log(data);
            $rootScope.objid=data;
            console.log($rootScope.objid);    
        }

        vm.getAllRecords = function() {
            $http.post('/api/getorders').then(function(response){
                vm.records=response.data;
                console.log(response);
            }, function(response){
                console.log(response);
            });
        }
        vm.getAllRecords();

$(document).ready(function() {
    if ($window.location.pathname === '/invoice'){
            $('div.navbar').hide();
            $('#footer').hide();
        }
            $http.post('api/getinvoicedetails/'+$rootScope.objid).then(function(response){
                console.log(response.data[0].baddress);
                $scope.date=response.data[0].date;
                $scope.projectname=response.data[0].projectname;
                $scope.firstname=response.data[0].firstname;

                $scope.baddress=response.data[0].baddress;
                $scope.bcity=response.data[0].bcity;
                $scope.bstate=response.data[0].bstate;
                $scope.bcountry=response.data[0].bcountry;
                $scope.bzip=response.data[0].bzip;

                $scope.saddress=response.data[0].saddress;
                $scope.scity=response.data[0].scity;
                $scope.sstate=response.data[0].sstate;
                $scope.scountry=response.data[0].scountry;
                $scope.szip=response.data[0].szip;

                $scope.gstnumber=response.data[0].gstnumber;
                $scope.costpregst=response.data[0].costpregst;
                $scope.quantity=response.data[0].quantity;
                $scope.cgst=Math.round(response.data[0].costpregst * 9)/100;
                $scope.igst=2*$scope.cgst;
                $scope.rate=response.data[0].costpregst/response.data[0].quantity;
                $scope.costpostgst=response.data[0].costpostgst;



                gsttype();

        function gsttype(){
            var res = $scope.sstate.match(/(\b[k][a][r][n][a][t][a][k][a]\b)|(\b[k][a][r]\b)/gi);
            if(res){
                $("#igst").hide();
                $('#igst1').hide();
                $('#igst2').hide();
            }else{
                $("#cgst").hide();
                $("#cgst1").hide();
                $("#cgst2").hide();
                $("#sgst").hide();
                $("#sgst1").hide();
                $("#sgst2").hide();
            }
        }
                withDecimal($scope.costpostgst);
                
            })
        })

      
        //decimal to word
        function withDecimal(n) {
            var nums = n.toString().split('.');
            NumToWord(nums[0], 'divDisplayWords');
            if (nums.length == 2) {
                NumToWord(nums[1], 'divDisplayWord');
            } /*else {
                return whole;
            }*/
        }


    function NumToWord(inputNumber, outputControl) {
        var str = new String(inputNumber);
        var splt = str.split("");
        var rev = splt.reverse();
        var once = ['Zero', ' One', ' Two', ' Three', ' Four', ' Five', ' Six', ' Seven', ' Eight', ' Nine'];
        var twos = ['Ten', ' Eleven', ' Twelve', ' Thirteen', ' Fourteen', ' Fifteen', ' Sixteen', ' Seventeen', ' Eighteen', ' Nineteen'];
        var tens = ['', 'Ten', ' Twenty', ' Thirty', ' Forty', ' Fifty', ' Sixty', ' Seventy', ' Eighty', ' Ninety'];

        numLength = rev.length;
        var word = new Array();
        var j = 0;

        for (i = 0; i < numLength; i++) {
            switch (i) {

                case 0:
                    if ((rev[i] == 0) || (rev[i + 1] == 1)) {
                        word[j] = '';
                    }
                    else {
                        word[j] = '' + once[rev[i]];
                    }
                    word[j] = word[j];
                    break;

                case 1:
                    aboveTens();
                    break;

                case 2:
                    if (rev[i] == 0) {
                        word[j] = '';
                    }
                    else if ((rev[i - 1] == 0) || (rev[i - 2] == 0)) {
                        word[j] = once[rev[i]] + " Hundred ";
                    }
                    else {
                        word[j] = once[rev[i]] + " Hundred and";
                    }
                    break;

                case 3:
                    if (rev[i] == 0 || rev[i + 1] == 1) {
                        word[j] = '';
                    }
                    else {
                        word[j] = once[rev[i]];
                    }
                    if ((rev[i + 1] != 0) || (rev[i] > 0)) {
                        word[j] = word[j] + " Thousand";
                    }
                    break;

                    
                case 4:
                    aboveTens();
                    break;

                case 5:
                    if ((rev[i] == 0) || (rev[i + 1] == 1)) {
                        word[j] = '';
                    }
                    else {
                        word[j] = once[rev[i]];
                    }
                    if (rev[i + 1] !== '0' || rev[i] > '0') {
                        word[j] = word[j] + " Lakh";
                    }
                     
                    break;

                case 6:
                    aboveTens();
                    break;

                case 7:
                    if ((rev[i] == 0) || (rev[i + 1] == 1)) {
                        word[j] = '';
                    }
                    else {
                        word[j] = once[rev[i]];
                    }
                    if (rev[i + 1] !== '0' || rev[i] > '0') {
                        word[j] = word[j] + " Crore";
                    }                
                    break;

                case 8:
                    aboveTens();
                    break;
                default: break;
            }
            j++;
        }

        function aboveTens() {
            if (rev[i] == 0) { word[j] = ''; }
            else if (rev[i] == 1) { word[j] = twos[rev[i - 1]]; }
            else { word[j] = tens[rev[i]]; }
        }

        word.reverse();
        var finalOutput = '';
        for (i = 0; i < numLength; i++) {
            finalOutput = finalOutput + word[i];
        }
        document.getElementById(outputControl).innerHTML = finalOutput;
    }

}]);