omni = angular.module("OmniVocab")

omni.controller('HomeController', ['$state', '$scope', '$timeout', '$mdToast',
    function($state, $scope, $timeout, $mdToast){

    //this might not be always correct, like synonyms, antonyms
    $scope.allWords = []
    //always correct
    $scope.allWordsMap = {}
    $scope.wordToBeAdded = {}

    $scope.loadWordsFromStorage = function() {
        chrome.storage.local.get("all-words", function (data) {
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

        allSynonymsStr = new Set()

        mainWord = {
            'word': word,
            'meaning': meaning
        }

        allWords = []
        allWords.push(mainWord)
        allSynonymsStr.add(angular.lowercase(mainWord.word))

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
            allSynonymsStr.add(angular.lowercase(synonymItem.word))
        })

        toStoreWords = []

        //get synonyms of existing words
        allWords.forEach(function(item) {

            wordExists = false
            existingWord = $scope.allWordsMap[angular.lowercase(item.word)]

            if(existingWord != undefined) {
                wordExists = true
                existingWord.synonyms.forEach(function(syn) {
                    allSynonymsStr.add(angular.lowercase(syn))
                })
            }

            toStoreWords.push(item)
        })

        //other words updated
        allSynonymsStr.forEach(function(syn) {
            alreadyQueuedObjs = toStoreWords.filter(function(o) {
                return angular.lowercase(o.word) == syn
            })

            if(alreadyQueuedObjs.length == 0) {
                otherUpdated = $scope.allWordsMap[syn]
                if(otherUpdated != undefined) {
                    console.log("Not queued for update nut needs update" + otherUpdated.word)
                    toStoreWords.push(otherUpdated)
                }
            }
        })

        //update or store
        toStoreWords.forEach(function(item) {
            item.synonyms = []
            allSynonymsStr.forEach(function(syn) {
                item.synonyms.push(syn)
            })

            wordExists = false
            existingWord = $scope.allWordsMap[angular.lowercase(item.word)]

            if(existingWord != undefined) {
                wordExists = true
                updatedWordsForMsg = (updatedWordsForMsg == '') ? item.word : (updatedWordsForMsg + ', ' + item.word)
            }

            $scope.allWordsMap[angular.lowercase(item.word)] = item
            
            if(!wordExists) {
                $scope.allWords.push(item)
            }
        })

        chrome.storage.local.set({"all-words": $scope.allWordsMap}, function() {
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
            function filter(words, query) {
                query = angular.lowercase(query)
                function createFilterFor(query) {
                    return function filterFn(item) {
                        return (
                            angular.lowercase(item.word).indexOf(query) === 0
                        );
                    };
                }

                return words.filter( createFilterFor(query) )
            }
            var results = query ? filter($scope.allWords, query) : []
            return results;
        }
    }
}])