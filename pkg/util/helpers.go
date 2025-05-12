package util

import (
	"net/url"
	"strings"
)

// IsNullOrWhitespace checks if a string is null, empty, or contains only whitespace
func IsNullOrWhitespace(s string) bool {
	return strings.TrimSpace(s) == ""
}

// ContainsIgnoreCase checks if a string slice contains a string, ignoring case
func ContainsIgnoreCase(slice []string, s string) bool {
	for _, item := range slice {
		if strings.EqualFold(item, s) {
			return true
		}
	}
	return false
}

// GetUserInfo extracts username and password from a URL
func GetUserInfo(urlString string) (string, string, error) {
	parsedURL, err := url.Parse(urlString)
	if err != nil {
		return "", "", err
	}

	if parsedURL.User == nil {
		return "", "", nil
	}

	password, _ := parsedURL.User.Password()
	return parsedURL.User.Username(), password, nil
}

// DiffSlices returns elements in slice a that are not in slice b
func DiffSlices(a, b []string) []string {
	result := make([]string, 0)
	
	for _, item := range a {
		found := false
		for _, bItem := range b {
			if strings.EqualFold(item, bItem) {
				found = true
				break
			}
		}
		
		if !found {
			result = append(result, item)
		}
	}
	
	return result
}