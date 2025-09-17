package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Port string
}

func LoadConfig(path string) (Config, error) {
	var config Config

	viper.SetConfigFile(path)
	if err := viper.ReadInConfig(); err != nil {
		return config, err
	}

	err := viper.Unmarshal(&config)
	return config, err
}
