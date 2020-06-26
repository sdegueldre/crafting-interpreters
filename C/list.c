#include <stdlib.h>

struct ListNode {
    struct ListNode *prev;
    struct ListNode *next;
    char *string;
};

struct ListNode *list_last(struct ListNode* list) {
    while(list->next != NULL) {
        list = list->next;
    }
    return list;
}

struct ListNode *list_first(struct ListNode* list) {
    while(list->prev != NULL) {
        list = list->prev;
    }
    return list;
}

struct ListNode* list_append(struct ListNode* list, char *string) {
    list = list_last(list);
    struct ListNode* node = malloc(sizeof(struct ListNode));
    if(node == NULL) {
        return NULL;
    }
    list->next = node;
    node->prev = list;
    node->next = NULL;
    node->string = string;
    return node;
}

struct ListNode* list_prepend(struct ListNode* list, char *string) {
    list = list_first(list);
    struct ListNode* node = malloc(sizeof(struct ListNode));
    if(node == NULL) {
        return NULL;
    }
    list->prev = node;
    node->next = list;
    node->prev = NULL;
    node->string = string;
    return node;
}

void list_remove(struct ListNode* node) {
    struct ListNode* prev = node->prev;
    struct ListNode* next = node->next;
    if (prev != NULL) {
        prev->next = next;
    }
    if (next != NULL) {
        next->prev = prev;
    }
    free(node);
}

void list_free(struct ListNode* list) {
    struct ListNode* prev = NULL;
    struct ListNode* next = NULL;
    if (list != NULL){
        prev = list->prev;
        next = list->next;
        free(list);
    }
    while(prev != NULL) {
        struct ListNode* to_free = prev;
        prev = prev->prev;
        free(to_free);
    }
    while(next != NULL) {
        struct ListNode* to_free = next;
        next = next->next;
        free(to_free);
    }
}

struct ListNode* list_find(struct ListNode *list, int (*compare)(char*)) {
    while (list != NULL) {
        if (compare(list->string)) {
            return list;
        }
        list = list->next;
    }
    return NULL;
}
