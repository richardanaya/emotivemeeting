# encoding: UTF-8
# 30 Days of Automation: GoodData Ruby SDK
# Visit http://sdk.gooddata.com/gooddata-ruby/ for Tutorials, Examples, and Support.

require 'rubygems'
require 'gooddata'

AUTH_TOKEN = 'ONBDIS852d718ca'

 GoodData.logging_on

GoodData.with_connection('dan.treiman@gmail.com', 'pAic2Aph2eF2od4v') do |c|
  blueprint = GoodData::Model::ProjectBlueprint.build("em-testing") do |p|
    p.add_date_dimension('date')

    p.add_dataset("meetings") do |d|
        d.add_anchor("meetingID")
        d.add_label("name", :reference => "meetingID")
    end

    p.add_dataset('persons') do |d|
        d.add_anchor('personID')
        d.add_label('name', :reference =>  "personID")
        d.add_attribute('role')
        d.add_attribute('trait')
    end

    p.add_dataset('actions') do |d|
      d.add_anchor('actionID')
      d.add_attribute('type')
      d.add_attribute('data')
    end

    p.add_dataset('notes') do |d|
      d.add_anchor('noteID')
      d.add_date('createdAt', :dataset => "date");
      d.add_attribute('text')
      d.add_fact('aggregate_score', :gd_data_type => "DECIMAL(6,5)")
      d.add_reference('personID', :dataset => "persons");
      d.add_reference('meetingID', :dataset => "meetings");
      d.add_reference('actionID', :dataset => "actions");
    end

    p.add_dataset('sentiments') do |d|
      d.add_anchor('sentimentID')
      d.add_fact('score', :gd_data_type => "DECIMAL(6,5)")
      d.add_attribute('sentiment');
      d.add_attribute('topic');
      d.add_reference('noteID', :dataset => "notes");
    end

  end

  project = GoodData::Project.create_from_blueprint(blueprint, :auth_token => AUTH_TOKEN)
  puts "Created project #{project.pid}"

  GoodData::with_project(project.pid) do |p|
    # Load data
   GoodData::Model.upload_data('data/persons.csv', blueprint, 'persons')
   GoodData::Model.upload_data('data/meetings.csv', blueprint, 'meetings')
   GoodData::Model.upload_data('data/actions.csv', blueprint, 'actions')
   GoodData::Model.upload_data('data/notes.csv', blueprint, 'notes')
   GoodData::Model.upload_data('data/sentiments.csv', blueprint, 'sentiments')

    # create  metric

# create a metric
    #metric = p.fact('fact.quotes.volume').create_metric
    #metric.save
    
    #report = p.create_report(title: 'Awesome_report', top: [metric], left: ['date.date.mmddyyyy'])
    #report.save

  end
end
