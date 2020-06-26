#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "list.c"

int compare(char *string) {
    return strstr(string, "I ") != NULL;
}

int main(int argc, char* argv[]) {
    struct ListNode *head = malloc(sizeof(struct ListNode));
    *head = (struct ListNode){NULL, NULL, "Hello World\n"};
    list_append(head, "I am Sam\n");
    list_append(head, "I like waffles\n");
    struct ListNode *found = list_find(head, compare);
    printf("%s", found->string);
    list_free(head);
}
