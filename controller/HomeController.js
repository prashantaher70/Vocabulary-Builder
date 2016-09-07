omni = angular.module("OmniVocab")

omni.controller('HomeController', ['$state', '$scope', '$timeout', '$mdToast',
    function($state, $scope, $timeout, $mdToast){

    $scope.allWords = []
    $scope.allWordsMap = {}
    $scope.wordToBeAdded = {}

    $scope.loadWordsFromStorage = function() {
        chrome.storage.sync.get("all-words", function (data) {
            $scope.allWordsMap = data["all-words"]

            if($scope.allWordsMap == undefined) {
                $scope.allWordsMap = {}
                $scope.allWords = []
            }

            for (var word in $scope.allWordsMap) {
                if ($scope.allWordsMap.hasOwnProperty(word)) {
                    $scope.allWords.push($scope.allWordsMap[word]);
                }
            }
        })
    }
    
    $scope.loadWordsFromStorage()

    $scope.addSynonym = function() {
        $scope.wordToBeAdded.synonyms.push({
            'word': '',
            'extraMeaning': '',
            'hasExtraMeaning': false
        })
    }

    $scope.restoreAddForm = function() {
        $scope.wordToBeAdded = {
            'word': '',
            'meaning': '',
            'synonyms': []
        }
    }

    $scope.saveWord = function() {
        synonyms = $scope.wordToBeAdded.synonyms
        word = $scope.wordToBeAdded.word
        meaning = $scope.wordToBeAdded.meaning
        updatedWordsForMsg = ''

        mainWord = {
            'word': word,
            'meaning': meaning
        }

        allWords = []
        allWords.push(mainWord)

        console.log(synonyms)
        synonyms.forEach(function(synonym) {
            synonymItem = {
                'word': synonym.word
            }

            if(synonym.hasExtraMeaning) {
                synonymItem.meaning = synonym.extraMeaning
            } else {
                synonymItem.meaning = meaning
            }

            allWords.push(synonymItem)
        })

        allWords.forEach(function(item) {
            wordToStore = item
            
            wordExists = false
            existingWord = $scope.allWordsMap[angular.lowercase(wordToStore.word)]

            if(existingWord != undefined) {
                wordExists = true
                updatedWordsForMsg = (updatedWordsForMsg == '') ? wordToStore.word : (updatedWordsForMsg + ', ' + wordToStore.word)
            }

            $scope.allWordsMap[angular.lowercase(item.word)] = wordToStore
            
            if(!existingWord) {
                $scope.allWords.push(wordToStore)
            }
        })

        chrome.storage.sync.set({"all-words": $scope.allWordsMap}, function() {
            msg = 'Saved'
            if(updatedWordsForMsg != '') {
                msg = 'Updated ' + updatedWordsForMsg
            }

            $mdToast.show(
                $mdToast.simple()
                .textContent(msg)
                .hideDelay(3000)
            )
        })
    }

    $scope.restoreAddForm()

    $scope.goToPage = function(page) {
        $scope.currentPage = page
    }


    $scope.autoComplete = {
        'selectedItem': null,
        'searchText': '',
        'searchTextChange': function(text) {

        },
        'selectedItemChange': function(item) {

        },
        'querySearch': function(query) {
            query = angular.lowercase(query)
            function createFilterFor(query) {
                return function filterFn(item) {
                    return (
                        angular.lowercase(item.word).indexOf(query) === 0
                    );
                };
            }

            var results = query ? $scope.allWords.filter( createFilterFor(query) ) : []
            return results;
        }
    }
}])